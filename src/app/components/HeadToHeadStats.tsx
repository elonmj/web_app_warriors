"use client";

import { useCallback, useEffect, useState } from "react";
import { Body, Heading } from "@/components/ui/Typography";
import PlayerStatsSkeleton from "./PlayerStatsSkeleton";
import MatchHistoryError from "./MatchHistoryError";

interface HeadToHeadRecord {
  opponentId: number;
  matches: number;
  wins: number;
  losses: number;
  draws: number;
  totalScore: [number, number];
  averageScore: [number, number];
  averageRatingChange: number;
  totalRatingChange: number;
  averagePR: number;
  totalPR: number;
  lastMatch: string;
  firstMatch: string;
  winRate: number;
}

interface HeadToHeadStatsProps {
  playerId: string | number;
}

export default function HeadToHeadStats({ playerId }: HeadToHeadStatsProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [records, setRecords] = useState<HeadToHeadRecord[]>([]);

  const fetchHeadToHead = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      if (!String(playerId).match(/^\d+$/)) {
        throw new Error('Invalid player ID format - must be a number');
      }
      
      console.log('Fetching head-to-head data for player:', playerId);
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || window.location.origin;
      const response = await fetch(`${baseUrl}/api/players/${playerId}/head-to-head`);

      if (!response.ok) {
        throw new Error('Failed to fetch head-to-head records');
      }

      const data = await response.json();
      setRecords(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load head-to-head records');
    } finally {
      setIsLoading(false);
    }
  }, [playerId]);

  useEffect(() => {
    fetchHeadToHead();
  }, [fetchHeadToHead]);

  const handleRetry = useCallback(() => {
    fetchHeadToHead();
  }, [fetchHeadToHead]);

  if (error) {
    return <MatchHistoryError message={error} onRetry={handleRetry} />;
  }

  if (isLoading) {
    return <PlayerStatsSkeleton />;
  }

  if (!records.length) {
    return (
      <div className="text-center py-6">
        <Body.Text className="text-onyx-600 dark:text-onyx-400">
          No head-to-head records available
        </Body.Text>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Most Played Opponents */}
      <div className="rounded-lg bg-white p-6 shadow dark:bg-gray-800">
        <Heading.H3 className="mb-4 text-gray-900 dark:text-white">
          Most Played Opponents
        </Heading.H3>
        <div className="divide-y divide-gray-200 dark:divide-gray-700">
          {records.slice(0, 5).map((record) => (
            <div key={record.opponentId} className="py-4">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <Body.Text className="font-medium text-gray-900 dark:text-white">
                    {record.opponentId} {/* TODO: Replace with opponent name */}
                  </Body.Text>
                  <Body.Caption className="text-gray-600 dark:text-gray-400">
                    {record.matches} matches played
                  </Body.Caption>
                </div>
                <div className="text-right">
                  <Body.Text className="font-medium text-gray-900 dark:text-white">
                    {record.wins}W - {record.draws}D - {record.losses}L
                  </Body.Text>
                  <Body.Caption 
                    className={`font-medium ${
                      record.winRate > 50 
                        ? 'text-green-600 dark:text-green-400' 
                        : record.winRate < 50 
                          ? 'text-red-600 dark:text-red-400'
                          : 'text-gray-600 dark:text-gray-400'
                    }`}
                  >
                    {record.winRate}% Win Rate
                  </Body.Caption>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4 mt-2">
                <div>
                  <Body.Caption className="text-gray-600 dark:text-gray-400">
                    Avg. Score
                  </Body.Caption>
                  <Body.Text className="font-medium text-gray-900 dark:text-white">
                    {record.averageScore[0]} - {record.averageScore[1]}
                  </Body.Text>
                </div>
                <div>
                  <Body.Caption className="text-gray-600 dark:text-gray-400">
                    Avg. Rating Change
                  </Body.Caption>
                  <Body.Text 
                    className={`font-medium ${
                      record.averageRatingChange > 0 
                        ? 'text-green-600 dark:text-green-400' 
                        : record.averageRatingChange < 0
                          ? 'text-red-600 dark:text-red-400'
                          : 'text-gray-600 dark:text-gray-400'
                    }`}
                  >
                    {record.averageRatingChange > 0 ? '+' : ''}{record.averageRatingChange}
                  </Body.Text>
                </div>
                <div>
                  <Body.Caption className="text-gray-600 dark:text-gray-400">
                    Avg. PR
                  </Body.Caption>
                  <Body.Text className="font-medium text-gray-900 dark:text-white">
                    {record.averagePR}
                  </Body.Text>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Performance Summary */}
      <div className="rounded-lg bg-white p-6 shadow dark:bg-gray-800">
        <Heading.H3 className="mb-4 text-gray-900 dark:text-white">
          Overall Head-to-Head Summary
        </Heading.H3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
          <div>
            <Body.Caption className="text-gray-600 dark:text-gray-400">
              Total Opponents
            </Body.Caption>
            <Heading.H4 className="mt-1 text-gray-900 dark:text-white">
              {records.length}
            </Heading.H4>
          </div>
          <div>
            <Body.Caption className="text-gray-600 dark:text-gray-400">
              Winning Record
            </Body.Caption>
            <Heading.H4 className="mt-1 text-gray-900 dark:text-white">
              {records.filter(r => r.winRate > 50).length}
            </Heading.H4>
          </div>
          <div>
            <Body.Caption className="text-gray-600 dark:text-gray-400">
              Best Win Rate
            </Body.Caption>
            <Heading.H4 className="mt-1 text-green-600 dark:text-green-400">
              {Math.max(...records.map(r => r.winRate))}%
            </Heading.H4>
          </div>
          <div>
            <Body.Caption className="text-gray-600 dark:text-gray-400">
              Most Matches
            </Body.Caption>
            <Heading.H4 className="mt-1 text-gray-900 dark:text-white">
              {Math.max(...records.map(r => r.matches))}
            </Heading.H4>
          </div>
        </div>
      </div>
    </div>
  );
}