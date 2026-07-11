"use client";

import { WooglesGameEvent } from '@/types/Woogles';
import { boardsBeforeEachEvent, Board } from '@/lib/board';

/**
 * Client-side equity analysis with wolges-wasm — the same engine Woogles.io
 * runs in the browser for its own analyzer (MIT, by Andy Kurnia).
 *
 * Letter encoding (standard A-Z distributions like french/english):
 *   rack:  0 = blank, 1..26 = A..Z
 *   board: 0 = empty, 1..26 = A..Z, negative = blank played as that letter
 */

export interface WolgesMove {
  equity: number;
  action: 'play' | 'exchange';
  down?: boolean;
  lane?: number;
  idx?: number;
  word?: number[];
  score?: number;
  tiles?: number[];
}

export type MoveTag = 'MISSED_BINGO' | 'BAD_LEAVE' | 'ENDGAME_ERROR';

export interface MoveEquity {
  eventIndex: number;
  playerIndex: number;
  playedEquity: number | null;
  bestEquity: number;
  /** null when the played move could not be scored (rare edge cases) */
  equityLoss: number | null;
  tags: MoveTag[];
  bestMoves: {
    display: string;
    coordinates: string;
    score: number;
    equity: number;
    isBingo: boolean;
  }[];
}

export interface EquityAnalysis {
  version: number;
  lexicon: string;
  engine: 'wolges-wasm';
  computedAt: string;
  perMove: MoveEquity[];
  /** total equity lost per player_index */
  totalLost: [number, number];
}

const SUPPORTED_LEXICA = ['FRA24', 'FRA20'];
// Assets available under public/wolges/ (FRA20 games analyze fine with FRA24)
const ASSET_LEXICON = 'FRA24';

type WolgesModule = {
  analyze(req: string): Promise<string>;
  play_score(req: string): string | Promise<string>;
  precache_kwg(key: string, value: Uint8Array): void;
  precache_klv(key: string, value: Uint8Array): void;
};

let wolgesPromise: Promise<WolgesModule> | null = null;

/**
 * The wolges wasm-bindgen module is a "bundler" target, but Next 14's webpack
 * cannot parse its wasm (reference types). So we bundle only the JS glue and
 * instantiate the .wasm at runtime from /public, wiring the two by hand the
 * same way the generated entry file would.
 */
async function getWolges(): Promise<WolgesModule> {
  if (!wolgesPromise) {
    wolgesPromise = (async () => {
      const glue = await import('./pkg/wolges_wasm_bg.js');
      const [wasmRes, kwgRes, klvRes] = await Promise.all([
        fetch('/wolges/wolges_wasm_bg.wasm'),
        fetch(`/wolges/${ASSET_LEXICON}.kwg`),
        fetch(`/wolges/${ASSET_LEXICON}.klv2`),
      ]);
      if (!wasmRes.ok) {
        throw new Error('Failed to load the analysis engine (public/wolges/wolges_wasm_bg.wasm)');
      }
      if (!kwgRes.ok || !klvRes.ok) {
        throw new Error('Failed to load French lexicon files (public/wolges/)');
      }

      const { instance } = await WebAssembly.instantiateStreaming(wasmRes, {
        './wolges_wasm_bg.js': glue as unknown as WebAssembly.ModuleImports,
      });
      glue.__wbg_set_wasm(instance.exports);
      (instance.exports as { __wbindgen_start?: () => void }).__wbindgen_start?.();

      const wolges = glue as unknown as WolgesModule;
      wolges.precache_kwg(ASSET_LEXICON, new Uint8Array(await kwgRes.arrayBuffer()));
      wolges.precache_klv(ASSET_LEXICON, new Uint8Array(await klvRes.arrayBuffer()));
      return wolges;
    })();
    wolgesPromise.catch(() => {
      wolgesPromise = null; // allow retry after a failed load
    });
  }
  return wolgesPromise;
}

export function lexiconSupported(lexicon: string): boolean {
  return SUPPORTED_LEXICA.includes(lexicon);
}

const A_CODE = 'A'.charCodeAt(0);

function rackToNums(rack: string): number[] {
  return [...rack]
    .map((ch) => (ch === '?' ? 0 : ch.toUpperCase().charCodeAt(0) - A_CODE + 1))
    .sort((a, b) => a - b);
}

function boardToNums(board: Board): number[][] {
  return board.map((row) =>
    row.map((cell) => {
      if (cell === '') return 0;
      const upper = cell.toUpperCase();
      const num = upper.charCodeAt(0) - A_CODE + 1;
      // lowercase = blank played as that letter -> negative for wolges
      return cell === upper ? num : -num;
    })
  );
}

/** played_tiles ('.'=playthrough, lowercase=blank) -> wolges word array */
function playedTilesToWord(playedTiles: string): number[] {
  return [...playedTiles].map((ch) => {
    if (ch === '.') return 0;
    const upper = ch.toUpperCase();
    const num = upper.charCodeAt(0) - A_CODE + 1;
    return ch === upper ? num : -num;
  });
}

function numToLabel(num: number): string {
  if (num === 0) return '.';
  const letter = String.fromCharCode(A_CODE + Math.abs(num) - 1);
  return num < 0 ? letter.toLowerCase() : letter;
}

function moveDisplay(move: WolgesMove): { display: string; coordinates: string } {
  if (move.action === 'exchange') {
    const tiles = (move.tiles ?? []).map(numToLabel).join('');
    return { display: tiles ? `Exch. ${tiles}` : 'Pass', coordinates: '-' };
  }
  const word = (move.word ?? []).map(numToLabel).join('');
  const lane = move.lane ?? 0;
  const idx = move.idx ?? 0;
  const coordinates = move.down
    ? `${String.fromCharCode(65 + lane)}${idx + 1}`
    : `${lane + 1}${String.fromCharCode(65 + idx)}`;
  return { display: word, coordinates };
}

function isBingoMove(move: WolgesMove): boolean {
  if (move.action !== 'play') return false;
  return (move.word ?? []).filter((n) => n !== 0).length === 7;
}

function baseRequest(board: Board, rack: string) {
  return {
    rack: rackToNums(rack),
    board: boardToNums(board),
    lexicon: ASSET_LEXICON,
    leave: ASSET_LEXICON,
    rules: 'CrosswordGame/french',
  };
}

const ANALYZABLE = new Set(['TILE_PLACEMENT_MOVE', 'EXCHANGE', 'PASS']);

/**
 * Analyze a full game: for each turn, compare the played move's equity to
 * the engine's best move. onProgress reports (done, total).
 */
export async function analyzeGame(
  events: WooglesGameEvent[],
  lexicon: string,
  onProgress?: (done: number, total: number) => void
): Promise<EquityAnalysis> {
  if (!lexiconSupported(lexicon)) {
    throw new Error(`Lexicon ${lexicon} is not supported by the local analyzer (French only)`);
  }
  const wolges = await getWolges();
  const boards = boardsBeforeEachEvent(events);

  const analyzable = events
    .map((e, i) => ({ e, i }))
    .filter(({ e }) => ANALYZABLE.has(e.type) && !!e.rack);

  const perMove: MoveEquity[] = [];
  const totalLost: [number, number] = [0, 0];
  let done = 0;

  for (const { e, i } of analyzable) {
    const board = boards[i];
    const req = baseRequest(board, e.rack);

    // Top moves by equity
    const bestStr = await wolges.analyze(JSON.stringify({ ...req, count: 10 }));
    const best = JSON.parse(bestStr) as WolgesMove[];
    const bestEquity = best.length > 0 ? best[0].equity : 0;

    // Equity of the actually played move
    let playedEquity: number | null = null;
    try {
      const play =
        e.type === 'TILE_PLACEMENT_MOVE'
          ? {
              action: 'play',
              down: e.direction === 'VERTICAL',
              lane: e.direction === 'VERTICAL' ? e.column : e.row,
              idx: e.direction === 'VERTICAL' ? e.row : e.column,
              word: playedTilesToWord(e.played_tiles),
            }
          : {
              action: 'exchange',
              tiles: e.type === 'EXCHANGE' ? rackToNums(e.exchanged) : [],
            };
      const scoredStr = await wolges.play_score(
        JSON.stringify({ ...req, plays: [play] })
      );
      const scored = JSON.parse(
        typeof scoredStr === 'string' ? scoredStr : JSON.stringify(scoredStr)
      );
      if (Array.isArray(scored) && scored[0]?.result === 'scored') {
        playedEquity = scored[0].equity;
      }
    } catch {
      playedEquity = null;
    }

    const equityLoss =
      playedEquity !== null
        ? Math.max(0, Math.round((bestEquity - playedEquity) * 10) / 10)
        : null;

    // Tagging
    const tags: MoveTag[] = [];
    const tilesLeftOnBoard = board.flat().filter((c) => c !== '').length;
    const isEndgame = tilesLeftOnBoard >= 74; // french bag (102) empty-ish: 102 - 2*7 - margin
    if (equityLoss !== null && equityLoss >= 3) {
      const playedBingo = e.type === 'TILE_PLACEMENT_MOVE' && e.is_bingo;
      const bestWasBingo = best.slice(0, 3).some(isBingoMove);
      if (bestWasBingo && !playedBingo) tags.push('MISSED_BINGO');
      if (isEndgame) tags.push('ENDGAME_ERROR');
      if (
        !tags.includes('MISSED_BINGO') &&
        e.type === 'TILE_PLACEMENT_MOVE' &&
        best[0]?.action === 'play' &&
        (best[0].score ?? 0) <= e.score
      ) {
        // Scored as much or more than the best move yet lost equity:
        // the difference is in the tiles kept back.
        tags.push('BAD_LEAVE');
      }
    }

    if (equityLoss !== null) {
      totalLost[e.player_index] += equityLoss;
    }

    perMove.push({
      eventIndex: i,
      playerIndex: e.player_index,
      playedEquity,
      bestEquity: Math.round(bestEquity * 10) / 10,
      equityLoss,
      tags,
      bestMoves: best.slice(0, 5).map((m) => {
        const d = moveDisplay(m);
        return {
          display: d.display,
          coordinates: d.coordinates,
          score: m.score ?? 0,
          equity: Math.round(m.equity * 10) / 10,
          isBingo: isBingoMove(m),
        };
      }),
    });

    done++;
    onProgress?.(done, analyzable.length);
  }

  return {
    version: 1,
    lexicon,
    engine: 'wolges-wasm',
    computedAt: new Date().toISOString(),
    perMove,
    totalLost: [
      Math.round(totalLost[0] * 10) / 10,
      Math.round(totalLost[1] * 10) / 10,
    ],
  };
}
