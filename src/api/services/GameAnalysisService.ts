import { WooglesGameData, WooglesGameEvent } from '@/types/Woogles';
import {
  GameAnalysisSummary,
  PlayerGameSummary,
  PlayerInsights,
  PlayerLeak,
  StoredGame,
} from '@/types/GameAnalysis';
import { tilesPlaced } from '@/lib/board';

const ANALYSIS_VERSION = 1;

/**
 * Engine-free statistical analysis of Woogles games.
 * Everything here derives from the event log (no equity engine needed);
 * the wolges-based equity layer builds on top of it in Phase 3.
 */
export class GameAnalysisService {
  computeGameSummary(game: StoredGame | WooglesGameData): GameAnalysisSummary {
    const gameId = 'gameId' in game ? game.gameId : '';
    const [nick0, nick1] = game.players;
    return {
      version: ANALYSIS_VERSION,
      gameId,
      computedAt: new Date().toISOString(),
      players: [
        this.summarizePlayer(game, 0, nick0),
        this.summarizePlayer(game, 1, nick1),
      ],
    };
  }

  private summarizePlayer(
    game: StoredGame | WooglesGameData,
    playerIndex: number,
    username: string
  ): PlayerGameSummary {
    const events = game.events ?? [];
    const mine = events.filter((e) => e.player_index === playerIndex);
    const placements = mine.filter((e) => e.type === 'TILE_PLACEMENT_MOVE');
    const turns = mine.filter(
      (e) =>
        e.type === 'TILE_PLACEMENT_MOVE' ||
        e.type === 'EXCHANGE' ||
        e.type === 'PASS'
    );

    const score = this.scoreOf(game, username);
    const opponentIdx = playerIndex === 0 ? 1 : 0;
    const won =
      score > this.scoreOf(game, game.players[opponentIdx]);

    const bingos = placements.filter((e) => e.is_bingo);
    const phonies = events.filter(
      (e) => e.type === 'PHONY_TILES_RETURNED' && e.player_index === playerIndex
    );
    // Points lost to a phony = score of the placement that was challenged off
    const phonyPointsLost = phonies.reduce((sum, phony) => {
      const prior = [...events]
        .slice(0, events.indexOf(phony))
        .reverse()
        .find(
          (e) =>
            e.type === 'TILE_PLACEMENT_MOVE' && e.player_index === playerIndex
        );
      return sum + (prior?.score ?? 0);
    }, 0);

    let tw = 0, dw = 0, tl = 0, dl = 0;
    for (const placement of placements) {
      for (const tile of tilesPlaced(placement)) {
        if (tile.premium === 'TW') tw++;
        else if (tile.premium === 'DW') dw++;
        else if (tile.premium === 'TL') tl++;
        else if (tile.premium === 'DL') dl++;
      }
    }

    return {
      username,
      score,
      won,
      turns: turns.length,
      avgScorePerTurn:
        turns.length > 0 ? Math.round((score / turns.length) * 10) / 10 : 0,
      bingos: bingos.length,
      bingoPoints: bingos.reduce((s, b) => s + b.score, 0),
      exchanges: mine.filter((e) => e.type === 'EXCHANGE').length,
      passes: mine.filter((e) => e.type === 'PASS').length,
      phonies: phonies.length,
      phonyPointsLost,
      tripleWordsUsed: tw,
      doubleWordsUsed: dw,
      tripleLettersUsed: tl,
      doubleLettersUsed: dl,
      scoreByPhase: this.scoreByPhase(turns),
    };
  }

  private scoreByPhase(turns: WooglesGameEvent[]): [number, number, number] {
    const phases: [number, number, number] = [0, 0, 0];
    if (turns.length === 0) return phases;
    for (let i = 0; i < turns.length; i++) {
      const phase = Math.min(2, Math.floor((i / turns.length) * 3));
      phases[phase] += turns[i].score;
    }
    return phases;
  }

  private scoreOf(game: StoredGame | WooglesGameData, username: string): number {
    const key = Object.keys(game.scores).find(
      (k) => k.toLowerCase() === username.toLowerCase()
    );
    return key !== undefined ? game.scores[key] : 0;
  }

  /**
   * Aggregate summaries into per-player insights, including the 2-3 leaks
   * that cost the most points ("topLeaks" for the Training Insights UI).
   */
  aggregateInsights(
    playerId: string,
    wooglesUsername: string,
    games: { game: StoredGame; summary: GameAnalysisSummary }[]
  ): PlayerInsights {
    const perGame = games
      .map(({ game, summary }) => {
        const idx = game.players.findIndex(
          (p) => p.toLowerCase() === wooglesUsername.toLowerCase()
        );
        if (idx === -1) return null;
        return {
          game,
          me: summary.players[idx],
          opp: summary.players[idx === 0 ? 1 : 0],
        };
      })
      .filter((x): x is NonNullable<typeof x> => x !== null);

    const n = perGame.length;
    const avg = (f: (x: (typeof perGame)[number]) => number) =>
      n === 0 ? 0 : perGame.reduce((s, x) => s + f(x), 0) / n;

    const insights: PlayerInsights = {
      playerId,
      wooglesUsername,
      updatedAt: new Date().toISOString(),
      gamesAnalyzed: n,
      wins: perGame.filter((x) => x.me.won).length,
      avgScore: Math.round(avg((x) => x.me.score)),
      avgScorePerTurn: Math.round(avg((x) => x.me.avgScorePerTurn) * 10) / 10,
      bingosPerGame: Math.round(avg((x) => x.me.bingos) * 100) / 100,
      avgOpponentScore: Math.round(avg((x) => x.opp.score)),
      topLeaks: this.detectLeaks(perGame.map((x) => ({ me: x.me, opp: x.opp }))),
      recentGames: perGame
        .slice()
        .sort((a, b) =>
          (b.game.createdAt ?? b.game.importedAt).localeCompare(
            a.game.createdAt ?? a.game.importedAt
          )
        )
        .slice(0, 20)
        .map((x) => ({
          gameId: x.game.gameId,
          date: x.game.createdAt ?? x.game.importedAt,
          score: x.me.score,
          opponentScore: x.opp.score,
          bingos: x.me.bingos,
          won: x.me.won,
        })),
    };
    return insights;
  }

  private detectLeaks(
    games: { me: PlayerGameSummary; opp: PlayerGameSummary }[]
  ): PlayerLeak[] {
    const n = games.length;
    if (n === 0) return [];
    const avg = (f: (g: (typeof games)[number]) => number) =>
      games.reduce((s, g) => s + f(g), 0) / n;

    const leaks: PlayerLeak[] = [];

    // 1. Bingo gap vs opponents (a bingo averages ~75 pts)
    const myBingos = avg((g) => g.me.bingos);
    const oppBingos = avg((g) => g.opp.bingos);
    if (oppBingos - myBingos > 0.3) {
      leaks.push({
        tag: 'FEW_BINGOS',
        label: 'Missed Bingos',
        detail: `You play ${myBingos.toFixed(1)} bingos/game vs ${oppBingos.toFixed(1)} for opponents`,
        avgPointsLostPerGame: Math.round((oppBingos - myBingos) * 75),
        occurrences: games.filter((g) => g.opp.bingos > g.me.bingos).length,
      });
    }

    // 2. Points lost to phonies
    const phonyLoss = avg((g) => g.me.phonyPointsLost);
    if (phonyLoss > 2) {
      leaks.push({
        tag: 'PHONY_LOSSES',
        label: 'Phony Words',
        detail: `Invalid words challenged off cost you points`,
        avgPointsLostPerGame: Math.round(phonyLoss),
        occurrences: games.filter((g) => g.me.phonies > 0).length,
      });
    }

    // 3. Scoring pace vs opponents
    const myPace = avg((g) => g.me.avgScorePerTurn);
    const oppPace = avg((g) => g.opp.avgScorePerTurn);
    const turns = Math.max(1, avg((g) => g.me.turns));
    if (oppPace - myPace > 1.5) {
      leaks.push({
        tag: 'LOW_SCORING_TURNS',
        label: 'Scoring Pace',
        detail: `${myPace.toFixed(1)} pts/turn vs ${oppPace.toFixed(1)} for opponents`,
        avgPointsLostPerGame: Math.round((oppPace - myPace) * turns),
        occurrences: games.filter(
          (g) => g.opp.avgScorePerTurn > g.me.avgScorePerTurn
        ).length,
      });
    }

    // 4. Endgame fade: last third much weaker than the rest
    const early = avg((g) => g.me.scoreByPhase[0] + g.me.scoreByPhase[1]) / 2;
    const late = avg((g) => g.me.scoreByPhase[2]);
    if (early > 0 && late < early * 0.7) {
      leaks.push({
        tag: 'WEAK_ENDGAME',
        label: 'Endgame',
        detail: 'Your scoring drops sharply in the last third of games',
        avgPointsLostPerGame: Math.round(early - late),
        occurrences: games.filter(
          (g) =>
            g.me.scoreByPhase[2] <
            ((g.me.scoreByPhase[0] + g.me.scoreByPhase[1]) / 2) * 0.7
        ).length,
      });
    }

    // 5. Premium underuse (TW/DW per game vs opponents)
    const myPremiums = avg((g) => g.me.tripleWordsUsed + g.me.doubleWordsUsed);
    const oppPremiums = avg((g) => g.opp.tripleWordsUsed + g.opp.doubleWordsUsed);
    if (oppPremiums - myPremiums > 0.8) {
      leaks.push({
        tag: 'PREMIUM_UNDERUSE',
        label: 'Premium Squares',
        detail: `Opponents reach word-multiplier squares more often than you`,
        avgPointsLostPerGame: Math.round((oppPremiums - myPremiums) * 15),
        occurrences: games.filter(
          (g) =>
            g.opp.tripleWordsUsed + g.opp.doubleWordsUsed >
            g.me.tripleWordsUsed + g.me.doubleWordsUsed
        ).length,
      });
    }

    // 6. Passing too much
    const passes = avg((g) => g.me.passes);
    if (passes > 1) {
      leaks.push({
        tag: 'TOO_MANY_PASSES',
        label: 'Passed Turns',
        detail: `${passes.toFixed(1)} passes/game — an exchange usually beats a pass`,
        avgPointsLostPerGame: Math.round(passes * 8),
        occurrences: games.filter((g) => g.me.passes > 0).length,
      });
    }

    return leaks
      .sort((a, b) => b.avgPointsLostPerGame - a.avgPointsLostPerGame)
      .slice(0, 3);
  }
}

export interface ClubLeak {
  tag: PlayerLeak['tag'];
  label: string;
  playersAffected: number;
  totalPlayers: number;
  avgPointsLostAcrossPlayers: number;
  players: { playerId: string; wooglesUsername: string; avgPointsLostPerGame: number }[];
}

/**
 * Aggregates each player's stored topLeaks (already computed by
 * aggregateInsights) across the whole club — surfaces the leaks shared by
 * the most players, for the coach to plan a targeted training session.
 * Pure function: no I/O, works on already-fetched PlayerInsights.
 */
export function aggregateClubLeaks(
  playerInsights: { playerId: string; insights: PlayerInsights }[]
): ClubLeak[] {
  const byTag = new Map<PlayerLeak['tag'], ClubLeak>();

  for (const { playerId, insights } of playerInsights) {
    for (const leak of insights.topLeaks) {
      let entry = byTag.get(leak.tag);
      if (!entry) {
        entry = {
          tag: leak.tag,
          label: leak.label,
          playersAffected: 0,
          totalPlayers: playerInsights.length,
          avgPointsLostAcrossPlayers: 0,
          players: [],
        };
        byTag.set(leak.tag, entry);
      }
      entry.playersAffected++;
      entry.players.push({
        playerId,
        wooglesUsername: insights.wooglesUsername,
        avgPointsLostPerGame: leak.avgPointsLostPerGame,
      });
    }
  }

  for (const entry of byTag.values()) {
    entry.avgPointsLostAcrossPlayers =
      Math.round(
        (entry.players.reduce((s, p) => s + p.avgPointsLostPerGame, 0) / entry.players.length) * 10
      ) / 10;
    entry.players.sort((a, b) => b.avgPointsLostPerGame - a.avgPointsLostPerGame);
  }

  return Array.from(byTag.values()).sort((a, b) => b.playersAffected - a.playersAffected);
}

export const gameAnalysisService = new GameAnalysisService();
