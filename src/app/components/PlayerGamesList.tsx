"use client";

import React, { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { format } from 'date-fns';
import { Body } from '@/components/ui/Typography';

interface GameRow {
  gameId: string;
  lexicon: string;
  date: string;
  players: [string, string];
  scores: { [player: string]: number };
  winner: string;
  matchId: string | null;
}

const headerCell =
  'px-4 py-3 text-left text-xs font-medium text-onyx-500 dark:text-onyx-400 uppercase tracking-wider';

export default function PlayerGamesList({
  playerId,
  wooglesUsername,
}: {
  playerId: string;
  wooglesUsername?: string;
}) {
  const [games, setGames] = useState<GameRow[]>([]);
  const [visible, setVisible] = useState(10);
  const [loading, setLoading] = useState(true);
  const [importing, setImporting] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    fetch(`/api/players/${playerId}/games`)
      .then((r) => (r.ok ? r.json() : { games: [] }))
      .then((data) => setGames(data.games ?? []))
      .catch(() => setGames([]))
      .finally(() => setLoading(false));
  }, [playerId]);

  useEffect(() => {
    load();
  }, [load]);

  const handleImport = async () => {
    setImporting(true);
    setNotice(null);
    try {
      const res = await fetch(`/api/players/${playerId}/woogles-import?count=50`, {
        method: 'POST',
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Import failed');
      setNotice(`Imported ${data.imported} game(s) from Woogles (${data.skipped} skipped).`);
      load();
    } catch (e) {
      setNotice(e instanceof Error ? e.message : 'Import failed');
    } finally {
      setImporting(false);
    }
  };

  const me = wooglesUsername?.toLowerCase();

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <Body.Caption className="text-onyx-500 dark:text-onyx-400">
          {games.length} game(s) imported from Woogles
        </Body.Caption>
        <button
          onClick={handleImport}
          disabled={importing || !wooglesUsername}
          title={!wooglesUsername ? 'No Woogles username configured for this player' : undefined}
          className="px-4 py-2 bg-amethyste-600 hover:bg-amethyste-500 text-white text-sm font-medium rounded-md disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {importing ? 'Importing…' : 'Import from Woogles'}
        </button>
      </div>

      {notice && (
        <div className="text-sm p-2 rounded-lg bg-amethyste-50 text-amethyste-800 dark:bg-amethyste-900/40 dark:text-amethyste-200">
          {notice}
        </div>
      )}

      {loading ? (
        <div className="bg-white dark:bg-onyx-900 rounded-lg border border-onyx-100 dark:border-onyx-800 h-32 animate-pulse" />
      ) : games.length === 0 ? (
        <div className="border border-dashed border-onyx-200 dark:border-onyx-700 rounded-lg p-6 text-center">
          <Body.Text className="text-onyx-500 dark:text-onyx-400">
            No games yet — press “Import from Woogles” to fetch this player&apos;s
            recent games.
          </Body.Text>
        </div>
      ) : (
        <div className="bg-white dark:bg-onyx-900 rounded-lg border border-onyx-100 dark:border-onyx-800 shadow-sm overflow-x-auto">
          <table className="min-w-full divide-y divide-onyx-100 dark:divide-onyx-800">
            <thead className="bg-onyx-50 dark:bg-onyx-800">
              <tr>
                <th className={headerCell}>Date</th>
                <th className={headerCell}>Opponent</th>
                <th className={headerCell}>Score</th>
                <th className={headerCell}>Lexicon</th>
                <th className={headerCell}>Type</th>
                <th className={headerCell}></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-onyx-100 dark:divide-onyx-800">
              {games.slice(0, visible).map((g) => {
                const iAmFirst = me
                  ? g.players[0].toLowerCase() === me
                  : true;
                const opponent = iAmFirst ? g.players[1] : g.players[0];
                const myScore = g.scores[iAmFirst ? g.players[0] : g.players[1]];
                const oppScore = g.scores[opponent];
                const won = me ? g.winner.toLowerCase() === me : false;
                return (
                  <tr
                    key={g.gameId}
                    className="hover:bg-onyx-50 dark:hover:bg-onyx-800 transition-colors"
                  >
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-onyx-900 dark:text-white">
                      {format(new Date(g.date), 'MMM d, yyyy')}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-onyx-900 dark:text-white">
                      {opponent}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm">
                      <span
                        className={
                          won
                            ? 'font-semibold text-green-600 dark:text-green-400'
                            : 'text-onyx-900 dark:text-white'
                        }
                      >
                        {myScore}
                      </span>
                      <span className="text-onyx-400"> – {oppScore}</span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className="inline-flex items-center rounded-full px-3 py-1 text-xs font-medium bg-onyx-100 text-onyx-800 dark:bg-onyx-800 dark:text-onyx-100">
                        {g.lexicon}
                      </span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-onyx-500 dark:text-onyx-400">
                      {g.matchId ? 'League match' : 'Training'}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-right">
                      <Link
                        href={`/player/${playerId}/analysis/${g.gameId}`}
                        className="inline-flex items-center px-3 py-1.5 text-sm font-medium rounded-md border border-onyx-200 dark:border-onyx-700 text-onyx-900 dark:text-white hover:border-amethyste-400 hover:text-amethyste-600 dark:hover:text-amethyste-400 transition-colors"
                      >
                        View
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {visible < games.length && (
            <div className="p-3 text-center">
              <button
                onClick={() => setVisible((v) => v + 10)}
                className="text-sm font-medium text-onyx-600 dark:text-onyx-300 hover:text-amethyste-600 dark:hover:text-amethyste-400 transition-colors"
              >
                Load more
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
