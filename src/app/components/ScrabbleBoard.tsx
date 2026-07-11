"use client";

import React from 'react';
import { Board, premiumAt, PremiumType } from '@/lib/board';

/** Ghost tiles: preview of an engine-suggested move on the board */
export interface GhostTile {
  row: number;
  col: number;
  letter: string;
}

const PREMIUM_CLASSES: Record<Exclude<PremiumType, null>, string> = {
  TW: 'bg-red-500/90 dark:bg-red-600 text-white',
  DW: 'bg-rose-300 dark:bg-rose-400/70 text-rose-900',
  TL: 'bg-diamant-600 text-white',
  DL: 'bg-diamant-200 dark:bg-diamant-300/60 text-diamant-900',
};

const PREMIUM_LABELS: Record<Exclude<PremiumType, null>, string> = {
  TW: 'MT',
  DW: 'MD',
  TL: 'LT',
  DL: 'LD',
};

export default function ScrabbleBoard({
  board,
  highlight = [],
  ghost = [],
}: {
  board: Board;
  /** Cells of the current move, shown with an accent ring */
  highlight?: { row: number; col: number }[];
  ghost?: GhostTile[];
}) {
  const isHighlighted = (r: number, c: number) =>
    highlight.some((h) => h.row === r && h.col === c);
  const ghostAt = (r: number, c: number) =>
    ghost.find((g) => g.row === r && g.col === c);

  return (
    <div
      className="grid gap-0.5 select-none w-full max-w-xl aspect-square"
      style={{ gridTemplateColumns: 'repeat(15, minmax(0, 1fr))' }}
      role="grid"
      aria-label="Scrabble board"
    >
      {board.map((row, r) =>
        row.map((cell, c) => {
          const premium = premiumAt(r, c);
          const ghostTile = ghostAt(r, c);
          const isCenter = r === 7 && c === 7;

          if (cell !== '') {
            const isBlank = cell !== cell.toUpperCase();
            return (
              <div
                key={`${r}-${c}`}
                role="gridcell"
                className={`flex items-center justify-center rounded-sm shadow-sm font-semibold text-[min(2.6vw,1rem)]
                  bg-amber-100 text-onyx-900 ${isBlank ? 'italic text-amethyste-700' : ''}
                  ${isHighlighted(r, c) ? 'ring-2 ring-amethyste-500 z-10' : ''}`}
              >
                {cell.toUpperCase()}
              </div>
            );
          }

          if (ghostTile) {
            return (
              <div
                key={`${r}-${c}`}
                role="gridcell"
                className="flex items-center justify-center rounded-sm font-semibold text-[min(2.6vw,1rem)] bg-amethyste-200/60 dark:bg-amethyste-500/30 text-amethyste-900 dark:text-amethyste-100"
              >
                {ghostTile.letter.toUpperCase()}
              </div>
            );
          }

          return (
            <div
              key={`${r}-${c}`}
              role="gridcell"
              className={`flex items-center justify-center rounded-sm text-[min(1.8vw,0.6rem)] font-medium
                ${premium ? PREMIUM_CLASSES[premium] : 'bg-onyx-100 dark:bg-onyx-800 text-onyx-400 dark:text-onyx-600'}`}
            >
              {isCenter ? (
                <span className="text-amethyste-600 text-[min(3vw,1rem)]">★</span>
              ) : premium ? (
                PREMIUM_LABELS[premium]
              ) : (
                ''
              )}
            </div>
          );
        })
      )}
    </div>
  );
}
