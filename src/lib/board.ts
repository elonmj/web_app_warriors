import { WooglesGameEvent } from '@/types/Woogles';

/**
 * Standard 15x15 crossword-game board model.
 * Reconstructs positions move by move from Woogles game events —
 * used for premium-square stats (Phase 2) and engine input (Phase 3).
 */

export type PremiumType = 'TW' | 'DW' | 'TL' | 'DL' | null;

const TW: [number, number][] = [
  [0, 0], [0, 7], [0, 14], [7, 0], [7, 14], [14, 0], [14, 7], [14, 14],
];
const DW: [number, number][] = [
  [1, 1], [2, 2], [3, 3], [4, 4], [7, 7],
  [1, 13], [2, 12], [3, 11], [4, 10],
  [13, 1], [12, 2], [11, 3], [10, 4],
  [13, 13], [12, 12], [11, 11], [10, 10],
];
const TL: [number, number][] = [
  [1, 5], [1, 9], [5, 1], [5, 5], [5, 9], [5, 13],
  [9, 1], [9, 5], [9, 9], [9, 13], [13, 5], [13, 9],
];
const DL: [number, number][] = [
  [0, 3], [0, 11], [2, 6], [2, 8], [3, 0], [3, 7], [3, 14],
  [6, 2], [6, 6], [6, 8], [6, 12], [7, 3], [7, 11],
  [8, 2], [8, 6], [8, 8], [8, 12], [11, 0], [11, 7], [11, 14],
  [12, 6], [12, 8], [14, 3], [14, 11],
];

const premiumGrid: PremiumType[][] = (() => {
  const grid: PremiumType[][] = Array.from({ length: 15 }, () =>
    Array<PremiumType>(15).fill(null)
  );
  for (const [r, c] of TW) grid[r][c] = 'TW';
  for (const [r, c] of DW) grid[r][c] = 'DW';
  for (const [r, c] of TL) grid[r][c] = 'TL';
  for (const [r, c] of DL) grid[r][c] = 'DL';
  return grid;
})();

export function premiumAt(row: number, col: number): PremiumType {
  if (row < 0 || row > 14 || col < 0 || col > 14) return null;
  return premiumGrid[row][col];
}

/** 15x15 grid of letters ('' = empty). Blanks are lowercase (Woogles/GCG convention). */
export type Board = string[][];

export function emptyBoard(): Board {
  return Array.from({ length: 15 }, () => Array(15).fill(''));
}

export interface PlacedTile {
  row: number;
  col: number;
  letter: string;
  premium: PremiumType;
}

/**
 * Tiles a TILE_PLACEMENT_MOVE actually places ('.' marks play-through
 * over existing tiles and is skipped).
 */
export function tilesPlaced(event: WooglesGameEvent): PlacedTile[] {
  if (event.type !== 'TILE_PLACEMENT_MOVE') return [];
  const tiles: PlacedTile[] = [];
  const horizontal = event.direction !== 'VERTICAL';
  for (let i = 0; i < event.played_tiles.length; i++) {
    const letter = event.played_tiles[i];
    if (letter === '.') continue;
    const row = horizontal ? event.row : event.row + i;
    const col = horizontal ? event.column + i : event.column;
    tiles.push({ row, col, letter, premium: premiumAt(row, col) });
  }
  return tiles;
}

export function applyEvent(board: Board, event: WooglesGameEvent): Board {
  if (event.type === 'TILE_PLACEMENT_MOVE') {
    for (const t of tilesPlaced(event)) {
      board[t.row][t.col] = t.letter;
    }
  } else if (event.type === 'PHONY_TILES_RETURNED') {
    // The previous placement is removed from the board. The caller that
    // replays sequentially should undo the previous TILE_PLACEMENT_MOVE.
  }
  return board;
}

/**
 * Board state BEFORE each event, replayed from the start.
 * boards[i] is the position the player at events[i] was facing.
 */
export function boardsBeforeEachEvent(events: WooglesGameEvent[]): Board[] {
  const boards: Board[] = [];
  let board = emptyBoard();
  for (let i = 0; i < events.length; i++) {
    boards.push(board.map((row) => [...row]));
    const e = events[i];
    if (e.type === 'PHONY_TILES_RETURNED') {
      // Undo the last placement by the same player
      for (let j = i - 1; j >= 0; j--) {
        if (
          events[j].type === 'TILE_PLACEMENT_MOVE' &&
          events[j].player_index === e.player_index
        ) {
          for (const t of tilesPlaced(events[j])) {
            board[t.row][t.col] = '';
          }
          break;
        }
      }
    } else {
      board = applyEvent(board, e);
    }
  }
  return boards;
}

export function finalBoard(events: WooglesGameEvent[]): Board {
  const boards = boardsBeforeEachEvent(events);
  if (events.length === 0) return emptyBoard();
  // Replay the very last event on top of the last "before" state
  const last = boards[boards.length - 1].map((row) => [...row]);
  return applyEvent(last, events[events.length - 1]);
}
