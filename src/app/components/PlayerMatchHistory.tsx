"use client";

import { format } from "date-fns";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { TrophyIcon, ClockIcon } from "@heroicons/react/24/outline";
import { Body, Heading } from "@/components/ui/Typography";
import PlayerStatsSkeleton from "./PlayerStatsSkeleton";
import MatchHistoryError from "./MatchHistoryError";
import { getCategoryColor } from "./utils/styles";
import { MatchDisplay, MatchHistoryResponse } from "@/types/MatchHistory";
import PlayerNameDisplay from "@/components/shared/PlayerNameDisplay";

interface PlayerMatchHistoryProps {
  playerId: string | number;
}

const PlayerMatchHistory = ({ playerId }: PlayerMatchHistoryProps) => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<MatchHistoryResponse | null>(null);
  const [page, setPage] = useState(1);
  const limit = 10;

  const fetchMatches = useCallback(async (offset: number) => {
    try {
      if (!playerId || typeof playerId !== 'string') {
        throw new Error('Invalid player ID');
      }

      if (!playerId.match(/^\d+$/)) {
        throw new Error('Invalid player ID format - must be a number');
      }

      setIsLoading(true);
      setError(null);

      // Debug logging
      console.log('Fetching matches with params:', {
        playerId,
        limit,
        offset,
        originalUrl: `/api/players/${playerId}/matches`
      });

      const encodedPlayerId = encodeURIComponent(playerId);
      const url = `/api/players/${encodedPlayerId}/matches?limit=${limit}&offset=${offset}`;
      console.log('Fetching matches from:', url);
      
      console.log('Constructed URL:', url);

      const response = await fetch(url, {
        headers: {
          'Accept': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch matches');
      }

      const newData = await response.json();
      setData((prevData: MatchHistoryResponse | null) => {
        if (!prevData) return newData;
        return {
          matches: [...prevData.matches, ...newData.matches],
          pagination: newData.pagination,
          statistics: newData.statistics
        };
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load matches';
      console.error('Match history error:', err);
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [playerId, limit]);

  useEffect(() => {
    console.log('PlayerMatchHistory mounted with ID:', playerId);
    fetchMatches(0);
  }, [fetchMatches]);

  const handleRetry = useCallback(() => {
    fetchMatches(0);
  }, [fetchMatches]);

  const handleReload = useCallback(() => {
    window.location.reload();
  }, []);

  if (error) {
    return <MatchHistoryError message={error} onRetry={handleRetry} />;
  }

  if (isLoading && !data) {
    return <PlayerStatsSkeleton />;
  }

  const matches = data?.matches || [];

  if (!matches.length) {
    return (
      <div className="text-center py-12">
        <div className="mx-auto w-12 h-12 rounded-full bg-onyx-100 flex items-center justify-center mb-4
          dark:bg-onyx-800">
          <TrophyIcon className="w-6 h-6 text-onyx-400" />
        </div>
        <Body.Text className="text-onyx-600 dark:text-onyx-400">
          No matches found
        </Body.Text>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {matches.map((match: MatchDisplay) => (
        <Link 
          key={match.id} 
          href={`/event/${match.eventId}/match/${match.id}`}
          className="block rounded-lg border border-onyx-200 bg-white p-4 sm:p-6
            hover:border-amethyste-200 hover:shadow-sm transition-all duration-200
            dark:bg-onyx-900 dark:border-onyx-800 dark:hover:border-amethyste-700"
        >
          {/* Match Header */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2 text-onyx-500 dark:text-onyx-400">
              <ClockIcon className="w-4 h-4" />
              <Body.Caption>
                {format(new Date(match.date), "MMM d, yyyy")}
              </Body.Caption>
            </div>
            <div className={`flex items-center gap-2 ${
              match.status === "completed" ? "text-green-600 dark:text-green-400" : "text-onyx-500 dark:text-onyx-400"
            }`}>
              <Body.Caption className="font-medium">
                {match.status === "completed" ? "Completed" : "In Progress"}
              </Body.Caption>
            </div>
          </div>

          {/* Match Content */}
          <div className="grid grid-cols-1 sm:grid-cols-[1fr,auto,1fr] gap-4 items-center">
            {/* Player 1 */}
            <div className="text-center sm:text-left">
              {match.player1Details && (
                <>
                  <PlayerNameDisplay
                    name={match.player1Details.name}
                    iscUsername={match.player1Details.iscUsername}
                  />
                  <Body.Caption className={getCategoryColor(match.player1Details.category)}>
                    {match.player1Details.category}
                  </Body.Caption>
                </>
              )}
            </div>

            {/* Score */}
            <div className="flex items-center justify-center gap-3">
              {match.result ? (
                <>
                  <Heading.H3 className="text-onyx-900 dark:text-white">
                    {match.result.score[0]}
                  </Heading.H3>
                  <Body.Text className="text-onyx-400">vs</Body.Text>
                  <Heading.H3 className="text-onyx-900 dark:text-white">
                    {match.result.score[1]}
                  </Heading.H3>
                </>
              ) : (
                <Body.Text className="text-onyx-400">vs</Body.Text>
              )}
            </div>

            {/* Player 2 */}
            <div className="text-center sm:text-right">
              {match.player2Details && (
                <>
                  <PlayerNameDisplay
                    name={match.player2Details.name}
                    iscUsername={match.player2Details.iscUsername}
                  />
                  <Body.Caption className={getCategoryColor(match.player2Details.category)}>
                    {match.player2Details.category}
                  </Body.Caption>
                </>
              )}
            </div>
          </div>

          {/* Match Stats */}
          {match.result && (
            <div className="mt-4 pt-4 border-t border-onyx-100 dark:border-onyx-800">
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center">
                  <Body.Caption>PR</Body.Caption>
                  <Body.Text className="font-medium text-onyx-900 dark:text-white">
                    {match.result.pr}
                  </Body.Text>
                </div>
                <div className="text-center">
                  <Body.Caption>PDI</Body.Caption>
                  <Body.Text className="font-medium text-onyx-900 dark:text-white">
                    {(match.result.pdi * 100).toFixed(0)}%
                  </Body.Text>
                </div>
                <div className="text-center">
                  <Body.Caption>DS</Body.Caption>
                  <Body.Text className="font-medium text-onyx-900 dark:text-white">
                    {match.result.ds}
                  </Body.Text>
                </div>
              </div>
            </div>
          )}
        </Link>
      ))}

      {/* Load More Button */}
      {data?.pagination.hasMore && (
        <div className="text-center pt-4">
          <button
            onClick={() => {
              const nextOffset = page * limit;
              setPage(p => p + 1);
              fetchMatches(nextOffset);
            }}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium 
              rounded-md shadow-sm text-white bg-amethyste-600 hover:bg-amethyste-700 
              focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amethyste-500 
              transition-colors duration-200
              dark:bg-amethyste-500 dark:hover:bg-amethyste-600
              dark:focus:ring-offset-gray-900
              disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={isLoading}
          >
            {isLoading ? 'Loading...' : 'Load More'}
          </button>
        </div>
      )}
    </div>
  );
};

export default PlayerMatchHistory;