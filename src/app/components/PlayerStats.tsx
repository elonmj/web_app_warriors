"use client";

import { Player } from "@/types/Player";
import PlayerStatsError from "./PlayerStatsError";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

interface PlayerStatsProps {
  player: Player;
}

export default function PlayerStats({ player }: PlayerStatsProps) {
  if (!player) {
    return <PlayerStatsError message="Player data not found" />;
  }

  // Handle potentially undefined values
  const currentRating = player.currentRating || 0;
  const category = player.category || "ONYX";
  const stats = player.statistics || {
    totalMatches: 0,
    wins: 0,
    draws: 0,
    losses: 0,
    totalPR: 0,
    averageDS: 0,
    inactivityWeeks: 0
  };

  // Calculate win rate
  const winRate = stats.totalMatches > 0
    ? Math.round((stats.wins / stats.totalMatches) * 100)
    : 0;

  // Calculate average PR per match
  const averagePR = stats.totalMatches > 0
    ? Math.round((stats.totalPR / stats.totalMatches) * 10) / 10
    : 0;

  // Extract ISC-specific data
  const iscStats = stats.iscData;
  const hasBingos = iscStats && iscStats.totalBingos > 0;
  const hasHighScores = iscStats && iscStats.highestScoringMove.score > 0;

  // Process match data for the charts
  const sortedMatches = player.matches
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  const recentMatches = sortedMatches
    .slice(-10)
    .map(match => ({
      date: match.date,
      score: match.result.score[0]
    }));

  const scoreDistribution = sortedMatches
    .slice(-20)
    .map(match => ({
      date: match.date,
      min: Math.min(...match.result.score),
      max: Math.max(...match.result.score),
      avg: match.result.score.reduce((a, b) => a + b, 0) / 2
    }));

  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
      {/* Rating Card */}
      <div className="rounded-lg bg-white p-6 shadow dark:bg-gray-800">
        <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">
          Current Rating
        </h3>
        <p className="mt-2 text-3xl font-semibold text-gray-900 dark:text-white">
          {currentRating}
        </p>
        <span
          className={`mt-2 inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium
            ${getCategoryStyle(category)}`}
        >
          {category}
        </span>
      </div>

      {/* Matches Card */}
      <div className="rounded-lg bg-white p-6 shadow dark:bg-gray-800">
        <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">
          Total Matches
        </h3>
        <p className="mt-2 text-3xl font-semibold text-gray-900 dark:text-white">
          {stats.totalMatches}
        </p>
        <div className="mt-2 text-sm text-gray-600 dark:text-gray-400">
          {stats.wins}W - {stats.draws}D - {stats.losses}L
        </div>
      </div>

      {/* Win Rate Card */}
      <div className="rounded-lg bg-white p-6 shadow dark:bg-gray-800">
        <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">
          Win Rate
        </h3>
        <p className="mt-2 text-3xl font-semibold text-gray-900 dark:text-white">
          {winRate}%
        </p>
        <div className="mt-2 text-sm text-gray-600 dark:text-gray-400">
          Over {stats.totalMatches} matches
        </div>
      </div>

      {/* Performance Card */}
      <div className="rounded-lg bg-white p-6 shadow dark:bg-gray-800">
        <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">
          Average Performance
        </h3>
        <p className="mt-2 text-3xl font-semibold text-gray-900 dark:text-white">
          {averagePR}
        </p>
        <div className="mt-2 text-sm text-gray-600 dark:text-gray-400">
          PR per match
        </div>
      </div>

      {/* Average Score Card */}
      {iscStats && (
        <div className="rounded-lg bg-white p-6 shadow dark:bg-gray-800">
          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">
            Average Score
          </h3>
          <p className="mt-2 text-3xl font-semibold text-gray-900 dark:text-white">
            {Math.round(iscStats.averageScore)}
          </p>
          <div className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            High: {iscStats.highestScore}
          </div>
        </div>
      )}

      {/* Bingos Card */}
      {hasBingos && (
        <div className="rounded-lg bg-white p-6 shadow dark:bg-gray-800">
          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">
            Bingo Words
          </h3>
          <p className="mt-2 text-3xl font-semibold text-gray-900 dark:text-white">
            {iscStats?.totalBingos}
          </p>
          {hasHighScores && (
            <div className="mt-2 text-sm text-gray-600 dark:text-gray-400">
              Best: {iscStats?.highestScoringMove.word} ({iscStats?.highestScoringMove.score}pts)
            </div>
          )}
        </div>
      )}

      {/* Additional Stats */}
      <div className="sm:col-span-2 lg:col-span-4">
        <div className="rounded-lg bg-white p-6 shadow dark:bg-gray-800">
          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">
            Detailed Statistics
          </h3>
          <div className="mt-4 grid gap-4 sm:grid-cols-3">
            <div>
              <span className="text-sm text-gray-500 dark:text-gray-400">
                Average DS
              </span>
              <p className="mt-1 text-lg font-medium text-gray-900 dark:text-white">
                {stats.averageDS}%
              </p>
            </div>
            <div>
              <span className="text-sm text-gray-500 dark:text-gray-400">
                Total PR
              </span>
              <p className="mt-1 text-lg font-medium text-gray-900 dark:text-white">
                {stats.totalPR}
              </p>
            </div>
            <div>
              <span className="text-sm text-gray-500 dark:text-gray-400">
                Inactivity
              </span>
              <p className="mt-1 text-lg font-medium text-gray-900 dark:text-white">
                {stats.inactivityWeeks} weeks
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Game Performance Charts */}
      <div className="sm:col-span-2 lg:col-span-4">
        <div className="rounded-lg bg-white p-6 shadow dark:bg-gray-800">
          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">
            Game Performance
          </h3>
          <div className="mt-4">
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={recentMatches}>
                <XAxis
                  dataKey="date"
                  tickFormatter={(date) => new Date(date).toLocaleDateString()}
                />
                <YAxis />
                <Tooltip
                  labelFormatter={(date) => new Date(date).toLocaleDateString()}
                  contentStyle={{
                    backgroundColor: 'rgb(31, 41, 55)',
                    border: 'none'
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="score"
                  name="Score"
                  stroke="#4F46E5"
                  strokeWidth={2}
                  dot={true}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            Last 10 matches
          </div>
        </div>
      </div>

      {/* Score Distribution */}
      {hasBingos && (
        <div className="sm:col-span-2 lg:col-span-4">
          <div className="rounded-lg bg-white p-6 shadow dark:bg-gray-800">
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">
              Score Distribution
            </h3>
            <div className="mt-4">
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={scoreDistribution}>
                  <XAxis
                    dataKey="date"
                    tickFormatter={(date) => new Date(date).toLocaleDateString()}
                  />
                  <YAxis />
                  <Tooltip
                    labelFormatter={(date) => new Date(date).toLocaleDateString()}
                    contentStyle={{
                      backgroundColor: 'rgb(31, 41, 55)',
                      border: 'none'
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="min"
                    name="Lowest"
                    stroke="#EF4444"
                    strokeWidth={2}
                    dot={false}
                  />
                  <Line
                    type="monotone"
                    dataKey="avg"
                    name="Average"
                    stroke="#FCD34D"
                    strokeWidth={2}
                    strokeDasharray="3 3"
                    dot={false}
                  />
                  <Line
                    type="monotone"
                    dataKey="max"
                    name="Highest"
                    stroke="#10B981"
                    strokeWidth={2}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
              <div className="mt-2 space-y-1 text-sm">
                <div className="text-gray-600 dark:text-gray-400">
                  Score range over last 20 matches
                </div>
                {iscStats && (
                  <div className="flex gap-4">
                    <span className="text-red-500 dark:text-red-400">
                      Lowest: {Math.min(...scoreDistribution.map(s => s.min))}
                    </span>
                    <span className="text-emerald-500 dark:text-emerald-400">
                      Highest: {Math.max(...scoreDistribution.map(s => s.max))}
                    </span>
                    <span className="text-yellow-500 dark:text-yellow-400">
                      Average: {Math.round(scoreDistribution.reduce((sum, s) => sum + s.avg, 0) / scoreDistribution.length)}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function getCategoryStyle(category: string): string {
  switch (category) {
    case "DIAMANT":
      return "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300";
    case "TOPAZE":
      return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300";
    case "AMÉTHYSTE":
      return "bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-300";
    case "ONYX":
    default:
      return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300";
  }
}