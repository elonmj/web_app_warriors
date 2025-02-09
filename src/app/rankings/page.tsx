'use client';

import { useEffect, useState } from 'react';
import PlayerRankings from '@/app/components/PlayerRankings';
import { EventRanking } from '@/types/Ranking';

export default function RankingsPage() {
  const [rankings, setRankings] = useState<EventRanking | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRankings = async () => {
      try {
        const response = await fetch('/api/rankings/global');
        if (!response.ok) throw new Error('Failed to fetch rankings');
        const data = await response.json();
        setRankings(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchRankings();
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-300 border-t-blue-600"></div>
          <p className="mt-2 text-gray-600 dark:text-gray-400">Loading rankings...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mt-8 rounded-lg bg-red-50 p-4 text-center dark:bg-red-900/20">
        <p className="text-red-600 dark:text-red-400">{error}</p>
      </div>
    );
  }

  return (
    <main className="container mx-auto px-4 py-8">
      <h1 className="mb-6 text-3xl font-bold text-gray-900 dark:text-white">
        Global Rankings
      </h1>
      <p className="mb-8 text-gray-600 dark:text-gray-400">
        Players ranked by their current rating
      </p>
      <PlayerRankings eventRanking={rankings} isGlobal={true} />
    </main>
  );
}