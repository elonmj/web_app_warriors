"use client";

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { ChevronLeftIcon, StarIcon } from '@heroicons/react/24/solid';
import { Heading, Body } from '@/components/ui/Typography';
import ScrabbleBoard from '@/app/components/ScrabbleBoard';
import { StoredGame } from '@/types/GameAnalysis';
import { WooglesGameEvent } from '@/types/Woogles';
import { boardsBeforeEachEvent, applyEvent, tilesPlaced } from '@/lib/board';
import {
  analyzeGame,
  lexiconSupported,
  EquityAnalysis,
  MoveEquity,
} from '@/lib/wolges/analyzer';

const TURN_TYPES = new Set(['TILE_PLACEMENT_MOVE', 'EXCHANGE', 'PASS']);

function equityChip(loss: number | null) {
  if (loss === null) return null;
  if (loss < 3)
    return (
      <span className="text-green-600 dark:text-green-400 text-xs font-semibold">✓</span>
    );
  const cls =
    loss > 20
      ? 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300'
      : loss > 8
        ? 'bg-topaze-100 text-topaze-800 dark:bg-topaze-800 dark:text-topaze-100'
        : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-300';
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${cls}`}>
      −{loss}
    </span>
  );
}

function describeEvent(e: WooglesGameEvent): string {
  if (e.type === 'EXCHANGE') return `Exch. ${e.exchanged || '?'}`;
  if (e.type === 'PASS') return 'Pass';
  return e.played_tiles;
}

export default function GameAnalysisPage({
  params,
}: {
  params: { playerId: string; gameId: string };
}) {
  const { playerId, gameId } = params;
  const [game, setGame] = useState<StoredGame | null>(null);
  const [equity, setEquity] = useState<EquityAnalysis | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState<{ done: number; total: number } | null>(null);
  const [selected, setSelected] = useState(0);

  useEffect(() => {
    fetch(`/api/games/${gameId}`)
      .then(async (r) => {
        if (!r.ok) throw new Error('Game not found');
        return r.json();
      })
      .then((data) => {
        setGame(data.game);
        if (data.analysis?.equity) setEquity(data.analysis.equity);
      })
      .catch((e) => setError(e instanceof Error ? e.message : 'Failed to load game'))
      .finally(() => setLoading(false));
  }, [gameId]);

  const events: WooglesGameEvent[] = useMemo(() => game?.events ?? [], [game]);
  const turnIndices = useMemo(
    () => events.map((e, i) => ({ e, i })).filter(({ e }) => TURN_TYPES.has(e.type)),
    [events]
  );
  const boards = useMemo(() => boardsBeforeEachEvent(events), [events]);

  const equityByEvent = useMemo(() => {
    const map = new Map<number, MoveEquity>();
    equity?.perMove.forEach((m) => map.set(m.eventIndex, m));
    return map;
  }, [equity]);

  if (loading) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-8">
        <div className="h-96 bg-white dark:bg-onyx-900 rounded-lg border border-onyx-100 dark:border-onyx-800 animate-pulse" />
      </div>
    );
  }

  if (error || !game) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-8 text-center">
        <Body.Text className="text-red-600 dark:text-red-400">
          {error ?? 'Game not found'}
        </Body.Text>
      </div>
    );
  }

  const clamp = (v: number) => Math.max(0, Math.min(turnIndices.length - 1, v));
  const current = turnIndices[clamp(selected)];
  const currentBoardBefore = current ? boards[current.i] : boards[0];
  // Board shown = position before the selected move, with the move applied
  const shownBoard = current
    ? applyEvent(currentBoardBefore.map((r) => [...r]), current.e)
    : currentBoardBefore;
  const highlight = current ? tilesPlaced(current.e).map(({ row, col }) => ({ row, col })) : [];
  const currentEquity = current ? equityByEvent.get(current.i) : undefined;

  const runAnalysis = async () => {
    try {
      setError(null);
      setAnalyzing({ done: 0, total: turnIndices.length });
      const result = await analyzeGame(events, game.lexicon, (done, total) =>
        setAnalyzing({ done, total })
      );
      setEquity(result);
      await fetch(`/api/games/${gameId}/equity`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(result),
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Analysis failed');
    } finally {
      setAnalyzing(null);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white shadow dark:bg-gray-800">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <Link
            href={`/player/${playerId}`}
            className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition-colors mb-2"
          >
            <ChevronLeftIcon className="w-4 h-4 mr-1" />
            Back to player
          </Link>
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <Heading.H1 className="text-gray-900 dark:text-white">
                {game.players[0]} {game.scores[game.players[0]]} – {game.scores[game.players[1]]}{' '}
                {game.players[1]}
              </Heading.H1>
              <div className="flex items-center gap-2 mt-2">
                <span className="inline-flex items-center rounded-full px-3 py-1 text-xs font-medium bg-onyx-100 text-onyx-800 dark:bg-onyx-800 dark:text-onyx-100">
                  {game.lexicon}
                </span>
                {equity && (
                  <Body.Caption className="text-onyx-500 dark:text-onyx-400">
                    Equity lost: {game.players[0]} −{equity.totalLost[0]} · {game.players[1]} −{equity.totalLost[1]}
                  </Body.Caption>
                )}
              </div>
            </div>
            {!equity &&
              (lexiconSupported(game.lexicon) ? (
                <button
                  onClick={runAnalysis}
                  disabled={analyzing !== null}
                  className="px-4 py-2 bg-amethyste-600 hover:bg-amethyste-500 text-white font-medium rounded-md disabled:opacity-60 transition-colors"
                >
                  {analyzing
                    ? `Analyzing… (${analyzing.done}/${analyzing.total})`
                    : 'Analyze with engine'}
                </button>
              ) : (
                <Body.Caption className="text-onyx-500 dark:text-onyx-400">
                  Engine analysis available for French games only
                </Body.Caption>
              ))}
            {equity && (
              <span className="text-green-600 dark:text-green-400 font-medium">Analyzed ✓</span>
            )}
          </div>
          {error && (
            <div className="mt-2 text-sm text-red-600 dark:text-red-400">{error}</div>
          )}
        </div>
      </div>

      {/* Main */}
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr),380px] gap-6">
          {/* Board + navigation */}
          <div className="space-y-4">
            <div className="bg-white dark:bg-onyx-900 p-4 rounded-lg border border-onyx-100 dark:border-onyx-800 shadow-sm flex justify-center">
              <ScrabbleBoard board={shownBoard} highlight={highlight} />
            </div>
            <div className="flex items-center justify-center gap-2">
              {[
                { label: '⏮', to: 0 },
                { label: '◀', to: clamp(selected - 1) },
                { label: '▶', to: clamp(selected + 1) },
                { label: '⏭', to: turnIndices.length - 1 },
              ].map((btn, i) => (
                <button
                  key={i}
                  onClick={() => setSelected(btn.to)}
                  className="w-10 h-10 rounded-md border border-onyx-200 dark:border-onyx-700 text-onyx-900 dark:text-white hover:border-amethyste-400 transition-colors"
                >
                  {btn.label}
                </button>
              ))}
              <Body.Caption className="ml-3 text-onyx-500 dark:text-onyx-400">
                Move {clamp(selected) + 1}/{turnIndices.length}
              </Body.Caption>
            </div>
            {current && (
              <div className="text-center">
                <Body.Text className="text-onyx-900 dark:text-white">
                  <span className="font-medium">
                    {game.players[current.e.player_index]}
                  </span>{' '}
                  · rack{' '}
                  <span className="font-mono">{current.e.rack || '?'}</span> ·{' '}
                  {describeEvent(current.e)} {current.e.position} (+{current.e.score})
                </Body.Text>
              </div>
            )}
          </div>

          {/* Moves + best moves */}
          <div className="space-y-4">
            <div className="bg-white dark:bg-onyx-900 rounded-lg border border-onyx-100 dark:border-onyx-800 shadow-sm overflow-hidden">
              <div className="max-h-96 overflow-y-auto divide-y divide-onyx-100 dark:divide-onyx-800">
                {turnIndices.map(({ e, i }, turnIdx) => {
                  const me = equityByEvent.get(i);
                  const isSelected = turnIdx === clamp(selected);
                  return (
                    <button
                      key={i}
                      onClick={() => setSelected(turnIdx)}
                      className={`w-full flex items-center justify-between px-4 py-2 text-left transition-colors ${
                        isSelected
                          ? 'bg-amethyste-50 dark:bg-amethyste-900/30'
                          : e.is_bingo
                            ? 'bg-yellow-50 dark:bg-yellow-900/20 hover:bg-onyx-50 dark:hover:bg-onyx-800'
                            : 'hover:bg-onyx-50 dark:hover:bg-onyx-800'
                      }`}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="text-xs text-onyx-400 w-6 shrink-0">
                          {turnIdx + 1}
                        </span>
                        <span
                          className={`text-sm font-medium shrink-0 ${
                            e.player_index === 0
                              ? 'text-indigo-600 dark:text-indigo-400'
                              : 'text-emerald-600 dark:text-emerald-400'
                          }`}
                        >
                          {game.players[e.player_index]}
                        </span>
                        <span className="text-sm font-mono text-onyx-900 dark:text-white truncate">
                          {describeEvent(e)}
                        </span>
                        {e.is_bingo && <StarIcon className="h-4 w-4 text-yellow-400 shrink-0" />}
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-sm text-onyx-500 dark:text-onyx-400">
                          +{e.score}
                        </span>
                        {me && equityChip(me.equityLoss)}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Best moves for the selected turn */}
            {currentEquity && (
              <div className="bg-white dark:bg-onyx-900 rounded-lg border border-onyx-100 dark:border-onyx-800 shadow-sm p-4">
                <Heading.H4 className="mb-3 text-onyx-900 dark:text-white">
                  Engine best moves
                </Heading.H4>
                {currentEquity.tags.length > 0 && (
                  <div className="flex gap-2 mb-3 flex-wrap">
                    {currentEquity.tags.map((tag) => (
                      <span
                        key={tag}
                        className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${
                          tag === 'MISSED_BINGO'
                            ? 'bg-amethyste-100 text-amethyste-800 dark:bg-amethyste-800 dark:text-amethyste-100'
                            : tag === 'BAD_LEAVE'
                              ? 'bg-topaze-100 text-topaze-800 dark:bg-topaze-800 dark:text-topaze-100'
                              : 'bg-diamant-100 text-diamant-800 dark:bg-diamant-800 dark:text-diamant-100'
                        }`}
                      >
                        {tag === 'MISSED_BINGO'
                          ? 'Missed bingo'
                          : tag === 'BAD_LEAVE'
                            ? 'Bad leave'
                            : 'Endgame error'}
                      </span>
                    ))}
                  </div>
                )}
                <div className="space-y-1">
                  {currentEquity.bestMoves.map((m, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between text-sm py-1"
                    >
                      <span className="font-mono text-onyx-900 dark:text-white">
                        {m.coordinates} {m.display}
                        {m.isBingo && (
                          <StarIcon className="inline h-3.5 w-3.5 text-yellow-400 ml-1" />
                        )}
                      </span>
                      <span className="text-onyx-500 dark:text-onyx-400">
                        {m.score} pts · eq {m.equity}
                      </span>
                    </div>
                  ))}
                  {currentEquity.playedEquity !== null && (
                    <div className="flex items-center justify-between text-sm py-1 border-t border-onyx-100 dark:border-onyx-800 mt-2 pt-2">
                      <Body.Caption className="text-onyx-500 dark:text-onyx-400">
                        Played · eq {currentEquity.playedEquity.toFixed(1)}
                      </Body.Caption>
                      {equityChip(currentEquity.equityLoss)}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
