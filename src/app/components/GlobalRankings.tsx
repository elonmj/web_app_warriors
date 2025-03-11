 "use client";

import React, { useState, useEffect } from 'react';
import { ref, get } from 'firebase/database';
import { db } from '@/lib/firebase';
import { Player } from '@/types/Player';
import { EventRanking } from '@/types/Ranking';
import { PlayerRankings } from './PlayerRankings';
import { RoundLoadingSkeleton } from './RoundLoadingSkeleton';
import { TrophyIcon } from "@heroicons/react/24/outline";
import { Body, Heading } from '@/components/ui/Typography';

// Use a constant for the global rankings identifier
const GLOBAL_RANKINGS_ID = 'global';

export function GlobalRankings() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [rankings, setRankings] = useState<EventRanking | null>(null);

  useEffect(() => {
    const fetchPlayers = async () => {
      try {
        setLoading(true);
        const playersRef = ref(db, 'players');
        const snapshot = await get(playersRef);
        
        if (!snapshot.exists()) {
          setRankings({
            eventId: GLOBAL_RANKINGS_ID,
            rankings: [],
            lastUpdated: new Date().toISOString(),
          });
          return;
        }

        const players = Object.entries(snapshot.val()).map(([id, data]) => ({
          id,
          ...(data as Omit<Player, 'id'>)
        }));

        // Sort players by rating in descending order
        const sortedPlayers = players.sort((a, b) => b.currentRating - a.currentRating);

        // Transform players into rankings format
        const globalRankings: EventRanking = {
          eventId: GLOBAL_RANKINGS_ID,
          rankings: sortedPlayers.map((player, index) => ({
            playerId: player.id,
            playerDetails: {
              name: player.name,
              category: player.category,
              currentRating: player.currentRating
            },
            rank: index + 1,
            rating: player.currentRating,
            points: player.statistics?.totalPR || 0,
            matches: player.matches?.length || 0,
            wins: player.statistics?.wins || 0,
            losses: player.statistics?.losses || 0,
            draws: player.statistics?.draws || 0,
            ratingChange: player.matches?.length 
              ? player.matches[player.matches.length - 1].ratingChange.change 
              : 0,
            category: player.category,
          })),
          lastUpdated: new Date().toISOString(),
        };

        setRankings(globalRankings);
      } catch (err) {
        console.error('Error fetching players:', err);
        setError('Failed to load rankings');
      } finally {
        setLoading(false);
      }
    };

    fetchPlayers();

    // Cleanup - no need to unsubscribe since we're using get() not onValue()
  }, []);

  if (loading) {
    return <RoundLoadingSkeleton />;
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="mx-auto w-12 h-12 rounded-full bg-onyx-100 flex items-center justify-center mb-4 dark:bg-onyx-800">
          <TrophyIcon className="w-6 h-6 text-onyx-400" />
        </div>
        <Heading.H3 className="mb-2">Error Loading Rankings</Heading.H3>
        <Body.Text className="text-onyx-600 dark:text-onyx-400">
          {error}
        </Body.Text>
      </div>
    );
  }

  if (!rankings || rankings.rankings.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="mx-auto w-12 h-12 rounded-full bg-onyx-100 flex items-center justify-center mb-4 dark:bg-onyx-800">
          <TrophyIcon className="w-6 h-6 text-onyx-400" />
        </div>
        <Heading.H3 className="mb-2">No Rankings Available</Heading.H3>
        <Body.Text className="text-onyx-600 dark:text-onyx-400">
          No players found in the database.
        </Body.Text>
      </div>
    );
  }

  return <PlayerRankings eventRanking={rankings} />;
}

export default GlobalRankings;
