"use client";

import React, { useEffect, useState } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { Heading, Body } from '@/components/ui/Typography';
import { PlayerInsights, LeakTag } from '@/types/GameAnalysis';

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

const cardClass =
  'bg-white dark:bg-onyx-900 p-4 rounded-lg border border-onyx-100 dark:border-onyx-800 shadow-sm';

const CATEGORY_ORDER = ['ONYX', 'AMÉTHYSTE', 'TOPAZE', 'DIAMANT'] as const;
const CATEGORY_CHIP_CLASSES: Record<string, string> = {
  ONYX: 'bg-onyx-100 text-onyx-800 dark:bg-onyx-800 dark:text-onyx-100',
  AMÉTHYSTE: 'bg-amethyste-100 text-amethyste-800 dark:bg-amethyste-800 dark:text-amethyste-100',
  TOPAZE: 'bg-topaze-100 text-topaze-800 dark:bg-topaze-800 dark:text-topaze-100',
  DIAMANT: 'bg-diamant-100 text-diamant-800 dark:bg-diamant-800 dark:text-diamant-100',
};

interface CategoryStat {
  matches: number;
  wins: number;
  draws: number;
  losses: number;
  averageRatingChange: number;
}

export default function TrainingInsights({ playerId }: { playerId: string }) {
  const [insights, setInsights] = useState<PlayerInsights | null>(null);
  const [loading, setLoading] = useState(true);
  const [categoryProgress, setCategoryProgress] = useState<Record<string, CategoryStat> | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/players/${playerId}/games`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (!cancelled) setInsights(data?.insights ?? null);
      })
      .catch(() => undefined)
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    // Category progression comes from league match history, independent of
    // Woogles game analysis — fetched separately so it still shows up even
    // if no games have been analyzed yet.
    fetch(`/api/players/${playerId}/statistics`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (!cancelled) setCategoryProgress(data?.detailed?.trends?.performanceByCategory ?? null);
      })
      .catch(() => undefined);

    return () => {
      cancelled = true;
    };
  }, [playerId]);

  const categoriesTraversed = CATEGORY_ORDER.filter((c) => categoryProgress?.[c]);

  const categoryProgressionBlock = categoriesTraversed.length > 0 && (
    <div className={cardClass}>
      <Heading.H4 className="mb-1 text-onyx-900 dark:text-white">
        Category progression
      </Heading.H4>
      <Body.Caption className="text-onyx-500 dark:text-onyx-400 mb-4 block">
        Every category you've played matches in, from lowest to highest.
      </Body.Caption>
      <div className="flex flex-wrap gap-3">
        {categoriesTraversed.map((cat) => {
          const stat = categoryProgress![cat];
          return (
            <div
              key={cat}
              className="flex flex-col gap-1 rounded-lg border border-onyx-100 dark:border-onyx-800 p-3 min-w-[140px]"
            >
              <span
                className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium w-fit ${CATEGORY_CHIP_CLASSES[cat]}`}
              >
                {cat}
              </span>
              <Body.Caption className="text-onyx-500 dark:text-onyx-400">
                {stat.matches} matches · {stat.wins}W-{stat.draws}D-{stat.losses}L
              </Body.Caption>
              <Body.Caption
                className={
                  stat.averageRatingChange >= 0
                    ? 'text-green-600 dark:text-green-400'
                    : 'text-red-600 dark:text-red-400'
                }
              >
                {stat.averageRatingChange >= 0 ? '+' : ''}
                {stat.averageRatingChange.toFixed(1)} rating/match avg
              </Body.Caption>
            </div>
          );
        })}
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="space-y-6">
        {categoryProgressionBlock}
        <div className={`${cardClass} animate-pulse h-32`} aria-label="Loading insights" />
      </div>
    );
  }

  if (!insights || insights.gamesAnalyzed === 0) {
    return (
      <div className="space-y-6">
        {categoryProgressionBlock}
        <div className="border border-dashed border-onyx-200 dark:border-onyx-700 rounded-lg p-6 text-center">
          <Body.Text className="text-onyx-500 dark:text-onyx-400">
            No analyzed games yet — import this player&apos;s Woogles games below to
            unlock training insights.
          </Body.Text>
        </div>
      </div>
    );
  }

  const chartData = insights.recentGames
    .slice()
    .reverse()
    .map((g, i) => ({
      game: i + 1,
      You: g.score,
      Opponent: g.opponentScore,
      bingos: g.bingos,
    }));

  return (
    <div className="space-y-6">
      {categoryProgressionBlock}

      {/* Top leak cards */}
      {insights.topLeaks.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {insights.topLeaks.map((leak, index) => (
            <div
              key={leak.tag}
              className={`${cardClass} ${
                index === 0
                  ? 'ring-1 ring-amethyste-500/40 border-amethyste-200 dark:border-amethyste-800'
                  : ''
              }`}
            >
              <span
                className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${LEAK_CHIP_CLASSES[leak.tag]}`}
              >
                {leak.label}
              </span>
              <Heading.H3 className="mt-3 text-onyx-900 dark:text-white">
                ~{leak.avgPointsLostPerGame} pts/game
              </Heading.H3>
              <Body.Caption className="text-onyx-500 dark:text-onyx-400 mt-1">
                {leak.detail} · {leak.occurrences} of {insights.gamesAnalyzed} games
              </Body.Caption>
            </div>
          ))}
        </div>
      ) : (
        <div className={cardClass}>
          <Body.Text className="text-green-600 dark:text-green-400 font-medium">
            No major leaks detected — keep it up!
          </Body.Text>
        </div>
      )}

      {/* Summary strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Games analyzed', value: insights.gamesAnalyzed },
          {
            label: 'Win rate',
            value: `${Math.round((insights.wins / insights.gamesAnalyzed) * 100)}%`,
          },
          { label: 'Avg score', value: insights.avgScore },
          { label: 'Bingos / game', value: insights.bingosPerGame },
        ].map((stat) => (
          <div key={stat.label} className={cardClass}>
            <Heading.H3 className="text-onyx-900 dark:text-white">
              {stat.value}
            </Heading.H3>
            <Body.Caption className="text-onyx-500 dark:text-onyx-400">
              {stat.label}
            </Body.Caption>
          </div>
        ))}
      </div>

      {/* Score trend vs opponents */}
      {chartData.length > 1 && (
        <div className={cardClass}>
          <Heading.H4 className="mb-4 text-onyx-900 dark:text-white">
            Recent games — you vs opponents
          </Heading.H4>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="currentColor" opacity={0.2} />
                <XAxis dataKey="game" stroke="currentColor" />
                <YAxis stroke="currentColor" />
                <Tooltip />
                <Legend />
                <Bar dataKey="You" fill="hsl(var(--chart-1))" radius={[3, 3, 0, 0]} />
                <Bar dataKey="Opponent" fill="hsl(var(--chart-2))" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
}
