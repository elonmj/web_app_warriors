"use client";

import React, { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Body } from '@/components/ui/Typography';

interface PlayerOption {
  id: string;
  name: string;
}

/**
 * "Find your profile" — no login, just a quick way for any of the club's
 * players to jump to their own dashboard (/player/[id]) and bookmark it.
 */
export default function PlayerPicker() {
  const router = useRouter();
  const [players, setPlayers] = useState<PlayerOption[]>([]);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/players?sort=name&order=asc')
      .then((r) => (r.ok ? r.json() : []))
      .then((data) => {
        const list = Array.isArray(data) ? data : (data?.players ?? []);
        setPlayers(list.map((p: PlayerOption) => ({ id: String(p.id), name: p.name })));
      })
      .catch(() => setPlayers([]))
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return players;
    return players.filter((p) => p.name.toLowerCase().includes(q));
  }, [players, query]);

  return (
    <section className="mx-auto max-w-6xl">
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Type your name…"
        className="w-full max-w-sm rounded-md border border-onyx-200 dark:border-onyx-700 bg-white dark:bg-onyx-900 text-onyx-900 dark:text-white px-4 py-2 text-sm focus:border-amethyste-500 focus:ring-amethyste-500 mb-4"
      />

      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-10 rounded-md bg-onyx-100 dark:bg-onyx-800 animate-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <Body.Text className="text-onyx-500 dark:text-onyx-400">No player matches.</Body.Text>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
          {filtered.map((p) => (
            <button
              key={p.id}
              onClick={() => router.push(`/player/${p.id}`)}
              className="text-left px-4 py-2 rounded-md border border-onyx-200 dark:border-onyx-700 bg-white dark:bg-onyx-900 text-onyx-900 dark:text-white text-sm font-medium hover:border-amethyste-400 hover:text-amethyste-600 dark:hover:text-amethyste-400 transition-colors truncate"
            >
              {p.name}
            </button>
          ))}
        </div>
      )}
    </section>
  );
}
