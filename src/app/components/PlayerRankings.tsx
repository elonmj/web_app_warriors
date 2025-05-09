"use client";

import React, { useState } from 'react';
import { EventRanking, PlayerRanking } from "@/types/Ranking";
import { PlayerCategory } from "@/types/Enums";
import { 
  TrophyIcon, 
  ArrowTrendingUpIcon, 
  ArrowTrendingDownIcon,
  ArrowLeftIcon,
  ArrowRightIcon
} from "@heroicons/react/24/outline";
import { Body } from "@/components/ui/Typography";
import { RoundLoadingSkeleton } from "./RoundLoadingSkeleton";
import Link from "next/link";

export interface PlayerRankingsProps {
  eventRanking: EventRanking;
  currentRound?: number;
  totalRounds?: number;
  onRoundChange?: (round: number) => void;
}

const getRankingChangeColor = (change: number) => {
  if (change > 0) return "text-green-600 dark:text-green-400";
  if (change < 0) return "text-red-600 dark:text-red-400";
  return "text-onyx-400 dark:text-onyx-500";
};

const getCategoryColor = (category: string) => {
  switch (category) {
    case PlayerCategory.ONYX:
      return "text-onyx-600 dark:text-onyx-400";
    case PlayerCategory.AMÉTHYSTE:
      return "text-amethyste-600 dark:text-amethyste-400";
    case PlayerCategory.TOPAZE:
      return "text-topaze-600 dark:text-topaze-400";
    case PlayerCategory.DIAMANT:
      return "text-diamant-600 dark:text-diamant-400";
    default:
      return "text-onyx-600 dark:text-onyx-400";
  }
};

export function PlayerRankings({ 
  eventRanking, 
  currentRound,
  totalRounds,
  onRoundChange 
}: PlayerRankingsProps): JSX.Element {
  const [isLoading, setIsLoading] = useState(false);

  // Use provided props or metadata values
  const round = currentRound || eventRanking.metadata?.round || 1;
  const total = totalRounds || eventRanking.metadata?.totalRounds;
  const showRoundNav = onRoundChange && total && total > 1;

  const handleRoundChange = async (newRound: number) => {
    if (onRoundChange) {
      setIsLoading(true);
      try {
        await onRoundChange(newRound);
      } finally {
        // Small delay to prevent flickering
        setTimeout(() => setIsLoading(false), 300);
      }
    }
  };

  if (isLoading) {
    return <RoundLoadingSkeleton />;
  }

  if (!eventRanking.rankings.length) {
    return (
      <div className="text-center py-12">
        <div className="mx-auto w-12 h-12 rounded-full bg-onyx-100 flex items-center justify-center mb-4
          dark:bg-onyx-800">
          <TrophyIcon className="w-6 h-6 text-onyx-400" />
        </div>
        <Body.Text className="text-onyx-600 dark:text-onyx-400">
          {total ? `No rankings available for round ${round}` : 'No rankings available'}
        </Body.Text>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Round Navigation */}
      {showRoundNav && (
        <div className="flex items-center justify-between px-4">
          <button
            onClick={() => handleRoundChange(round - 1)}
            disabled={round <= 1 || isLoading}
            className="flex items-center gap-1 px-2 py-1 text-sm font-medium text-onyx-600 hover:text-onyx-900 
              disabled:opacity-50 disabled:cursor-not-allowed dark:text-onyx-400 dark:hover:text-white"
          >
            <ArrowLeftIcon className="w-4 h-4" />
            Previous Round
          </button>
          <Body.Text className="font-medium">
            Round {round} of {total}
          </Body.Text>
          <button
            onClick={() => handleRoundChange(round + 1)}
            disabled={round >= total || isLoading}
            className="flex items-center gap-1 px-2 py-1 text-sm font-medium text-onyx-600 hover:text-onyx-900 
              disabled:opacity-50 disabled:cursor-not-allowed dark:text-onyx-400 dark:hover:text-white"
          >
            Next Round
            <ArrowRightIcon className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Rankings Table */}
      <div className="flow-root">
        <div className="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
          <div className="inline-block min-w-full py-2 align-middle sm:px-6 lg:px-8">
            <div className="overflow-hidden shadow ring-1 ring-onyx-200 dark:ring-onyx-800 rounded-lg">
              <table className="min-w-full divide-y divide-onyx-200 dark:divide-onyx-800">
                <thead className="bg-onyx-50 dark:bg-onyx-900">
                  <tr>
                    <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-onyx-900 dark:text-white sm:pl-6">
                      Position
                    </th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-onyx-900 dark:text-white">
                      Player
                    </th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-onyx-900 dark:text-white">
                      Category
                    </th>
                    <th scope="col" className="px-3 py-3.5 text-center text-sm font-semibold text-onyx-900 dark:text-white">
                      Rating
                    </th>
                    <th scope="col" className="px-3 py-3.5 text-center text-sm font-semibold text-onyx-900 dark:text-white">
                      Points
                    </th>
                    <th scope="col" className="px-3 py-3.5 text-center text-sm font-semibold text-onyx-900 dark:text-white">
                      Change
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-onyx-200 bg-white dark:divide-onyx-800 dark:bg-onyx-900">
                  {eventRanking.rankings.map((ranking: PlayerRanking) => (
                    <tr key={ranking.playerId} className="hover:bg-onyx-50 dark:hover:bg-onyx-800/50 transition-colors">
                      <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm sm:pl-6">
                        <div className="flex items-center">
                          <Body.Text variant="sm" className="font-medium">
                            {ranking.rank}
                          </Body.Text>
                        </div>
                      </td>
                      <td className="whitespace-nowrap px-3 py-4">
                        <Link
                          href={`/player/${ranking.playerId}`}
                          className="group block"
                          aria-label={`View ${ranking.playerDetails?.name || 'Unknown Player'}'s statistics`}
                        >
                          <Body.Text
                            variant="sm"
                            className="font-medium transition-colors group-hover:text-amethyste-600 dark:group-hover:text-amethyste-400 focus-visible:text-amethyste-600 dark:focus-visible:text-amethyste-400"
                          >
                            {ranking.playerDetails?.name || 'Unknown Player'}
                          </Body.Text>
                        </Link>
                      </td>
                      <td className="whitespace-nowrap px-3 py-4">
                        <Body.Text variant="sm" className={`${getCategoryColor(ranking.category)}`}>
                          {ranking.category}
                        </Body.Text>
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-center">
                        <Body.Text variant="sm" className="font-medium">
                          {ranking.rating}
                        </Body.Text>
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-center">
                        <Body.Text variant="sm" className="font-medium">
                          {ranking.points}
                        </Body.Text>
                      </td>
                      <td className="whitespace-nowrap px-3 py-4">
                        <div className="flex items-center justify-center gap-1">
                          {ranking.ratingChange !== 0 && (
                            ranking.ratingChange > 0 ? (
                              <ArrowTrendingUpIcon className="w-4 h-4 text-green-600 dark:text-green-400" />
                            ) : (
                              <ArrowTrendingDownIcon className="w-4 h-4 text-red-600 dark:text-red-400" />
                            )
                          )}
                          <Body.Text 
                            variant="sm" 
                            className={`font-medium ${getRankingChangeColor(ranking.ratingChange)}`}
                          >
                            {ranking.ratingChange > 0 ? '+' : ''}{ranking.ratingChange}
                          </Body.Text>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* Round Info */}
      <div className="p-4 bg-onyx-50 rounded-lg dark:bg-onyx-800/50">
        <div className="flex items-center justify-between">
          <Body.Text variant="sm" className="text-onyx-600 dark:text-onyx-400">
            Last updated: {new Date(eventRanking.lastUpdated).toLocaleDateString()}
          </Body.Text>
          {eventRanking.metadata?.isCurrentRound && (
            <span className="px-2 py-0.5 bg-amethyste-100 text-amethyste-700 rounded-full text-xs font-medium dark:bg-amethyste-900/30 dark:text-amethyste-400">
              Current Round
            </span>
          )}
          {eventRanking.metadata?.completed && (
            <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded-full text-xs font-medium dark:bg-green-900/30 dark:text-green-400">
              Completed
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

export default PlayerRankings;