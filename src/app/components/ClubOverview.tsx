"use client";

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Heading, Body } from '@/components/ui/Typography';
import { LeakTag } from '@/types/GameAnalysis';

const LEAK_CHIP_CLASSES: Record<LeakTag, string> = {
  FEW_BINGOS:
    'bg-amethyste-100 text-amethyste-800 dark:bg-amethyste-800 dark:text-amethyste-100',
  PHONY_LOSSES: 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300',
  LOW_SCORING_TURNS:
    'bg-topaze-100 text-topaze-800 dark:bg-topaze-800 dark:text-topaze-100',
  WEAK_ENDGAME:
    'bg-diamant-100 text-diamant-800 dark:bg-diamant-800 dark:text-diamant-100',
  PREMIUM_UNDERUSE:
    'bg-topaze-100 text-topaze-800 dark:bg-topaze-800 dark:text-topaze-100',
  TOO_MANY_PASSES:
    'bg-onyx-100 text-onyx-800 dark:bg-onyx-800 dark:text-onyx-100',
};

const CATEGORY_CHIP_CLASSES: Record<string, string> = {
  ONYX: 'bg-onyx-100 text-onyx-800 dark:bg-onyx-800 dark:text-onyx-100',
  AMÉTHYSTE: 'bg-amethyste-100 text-amethyste-800 dark:bg-amethyste-800 dark:text-amethyste-100',
  TOPAZE: 'bg-topaze-100 text-topaze-800 dark:bg-topaze-800 dark:text-topaze-100',
  DIAMANT: 'bg-diamant-100 text-diamant-800 dark:bg-diamant-800 dark:text-diamant-100',
};

const cardClass =
  'bg-white dark:bg-onyx-900 p-4 rounded-lg border border-onyx-100 dark:border-onyx-800 shadow-sm';

interface ClubOverviewData {
  totalPlayers: number;
  playersWithAnalyzedGames: number;
  activity: { playerId: string; name: string; lastActivityDate: string; weeksSinceLastActivity: number }[];
  categoryProgress: { playerId: string; name: string; category: string; changedAt: string }[];
  leaks: {
    tag: LeakTag;
    label: string;
    playersAffected: number;
    totalPlayers: number;
    avgPointsLostAcrossPlayers: number;
    players: { playerId: string; name: string; avgPointsLostPerGame: number }[];
  }[];
}

export default function ClubOverview() {
  const [data, setData] = useState<ClubOverviewData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/club/overview')
      .then((r) => (r.ok ? r.json() : null))
      .then(setData)
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {[1, 2, 3].map((i) => (
          <div key={i} className={`${cardClass} h-64 animate-pulse`} />
        ))}
      </div>
    );
  }

  if (!data) {
    return (
      <Body.Text className="text-onyx-500 dark:text-onyx-400 text-center py-12">
        Unable to load club overview.
      </Body.Text>
    );
  }

  const inactivePlayers = data.activity.filter((a) => a.weeksSinceLastActivity >= 3);

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Players', value: data.totalPlayers },
          { label: 'With analyzed games', value: data.playersWithAnalyzedGames },
          { label: 'Inactive 3+ weeks', value: inactivePlayers.length },
          { label: 'Shared leaks found', value: data.leaks.length },
        ].map((s) => (
          <div key={s.label} className={cardClass}>
            <Heading.H3 className="text-onyx-900 dark:text-white">{s.value}</Heading.H3>
            <Body.Caption className="text-onyx-500 dark:text-onyx-400">{s.label}</Body.Caption>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Shared leaks — drives training session planning */}
        <section className={`${cardClass} lg:col-span-1`}>
          <Heading.H4 className="mb-1 text-onyx-900 dark:text-white">Shared Leaks</Heading.H4>
          <Body.Caption className="text-onyx-500 dark:text-onyx-400 mb-4 block">
            Training gaps shared by several players — plan a session around the top one.
          </Body.Caption>
          {data.leaks.length === 0 ? (
            <Body.Text className="text-onyx-500 dark:text-onyx-400">
              No shared leaks yet — analyze more games to unlock this.
            </Body.Text>
          ) : (
            <div className="space-y-3">
              {data.leaks.map((leak) => (
                <div key={leak.tag} className="rounded-lg border border-onyx-100 dark:border-onyx-800 p-3">
                  <div className="flex items-center justify-between mb-1">
                    <span
                      className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${LEAK_CHIP_CLASSES[leak.tag]}`}
                    >
                      {leak.label}
                    </span>
                    <Body.Caption className="text-onyx-500 dark:text-onyx-400">
                      {leak.playersAffected}/{leak.totalPlayers} players
                    </Body.Caption>
                  </div>
                  <Body.Caption className="text-onyx-500 dark:text-onyx-400">
                    ~{leak.avgPointsLostAcrossPlayers} pts/game avg ·{' '}
                    {leak.players.slice(0, 4).map((p, i) => (
                      <React.Fragment key={p.playerId}>
                        {i > 0 && ', '}
                        <Link
                          href={`/player/${p.playerId}`}
                          className="hover:text-amethyste-600 dark:hover:text-amethyste-400 underline"
                        >
                          {p.name}
                        </Link>
                      </React.Fragment>
                    ))}
                    {leak.players.length > 4 && ` +${leak.players.length - 4} more`}
                  </Body.Caption>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Activity — flag decrocheurs */}
        <section className={`${cardClass} lg:col-span-1`}>
          <Heading.H4 className="mb-1 text-onyx-900 dark:text-white">Activity</Heading.H4>
          <Body.Caption className="text-onyx-500 dark:text-onyx-400 mb-4 block">
            Time since each player's last match or game.
          </Body.Caption>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {data.activity.slice(0, 20).map((a) => (
              <div key={a.playerId} className="flex items-center justify-between text-sm py-1">
                <Link
                  href={`/player/${a.playerId}`}
                  className="text-onyx-900 dark:text-white hover:text-amethyste-600 dark:hover:text-amethyste-400"
                >
                  {a.name}
                </Link>
                <span
                  className={
                    a.weeksSinceLastActivity >= 3
                      ? 'text-red-600 dark:text-red-400 font-medium'
                      : 'text-onyx-500 dark:text-onyx-400'
                  }
                >
                  {a.weeksSinceLastActivity === 0
                    ? 'This week'
                    : `${a.weeksSinceLastActivity}w ago`}
                </span>
              </div>
            ))}
          </div>
        </section>

        {/* Category progression — who's climbing */}
        <section className={`${cardClass} lg:col-span-1`}>
          <Heading.H4 className="mb-1 text-onyx-900 dark:text-white">Category Progression</Heading.H4>
          <Body.Caption className="text-onyx-500 dark:text-onyx-400 mb-4 block">
            Most recent category changes, newest first.
          </Body.Caption>
          {data.categoryProgress.length === 0 ? (
            <Body.Text className="text-onyx-500 dark:text-onyx-400">
              No category changes recorded yet.
            </Body.Text>
          ) : (
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {data.categoryProgress.slice(0, 20).map((c) => (
                <div key={c.playerId} className="flex items-center justify-between text-sm py-1 gap-2">
                  <Link
                    href={`/player/${c.playerId}`}
                    className="text-onyx-900 dark:text-white hover:text-amethyste-600 dark:hover:text-amethyste-400 truncate"
                  >
                    {c.name}
                  </Link>
                  <span
                    className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium shrink-0 ${CATEGORY_CHIP_CLASSES[c.category] ?? ''}`}
                  >
                    {c.category}
                  </span>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
