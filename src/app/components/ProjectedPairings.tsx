"use client";

import { useState, useEffect } from "react";
import { Match } from "@/types/Match";
import { ArrowPathIcon, LightBulbIcon } from "@heroicons/react/24/outline";
import EventRoundPairings from "./EventRoundPairings";

interface ProjectedPairingsProps {
  eventId: string;
  currentRound: number;
}

export default function ProjectedPairings({ eventId, currentRound }: ProjectedPairingsProps) {
  const [projectedPairings, setProjectedPairings] = useState<Match[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPairings = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/events/${eventId}/pairings`);
      if (!response.ok) throw new Error('Failed to fetch pairings');
      const data = await response.json();
      setProjectedPairings(data.matches);
    } catch (err) {
      setError('Failed to load projected pairings');
      console.error('Error loading pairings:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPairings();
  }, [eventId, currentRound]);

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 dark:bg-red-900/20 dark:border-red-800">
        <p className="text-red-700 text-sm dark:text-red-300">{error}</p>
        <button
          onClick={fetchPairings}
          className="mt-2 text-red-600 hover:text-red-800 text-sm font-medium dark:text-red-400 dark:hover:text-red-300"
        >
          Try again
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-amber-200 overflow-hidden dark:border-amber-800">
        <div className="bg-amber-50 p-4 dark:bg-amber-900/20">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <LightBulbIcon className="h-5 w-5 text-amber-600 dark:text-amber-500" />
                <h3 className="font-medium text-amber-900 dark:text-amber-100">
                  Projected Pairings for Next Round
                </h3>
              </div>
              <p className="mt-1 text-sm text-amber-700 dark:text-amber-300">
                These are projected match-ups based on current rankings. They will only be confirmed when the current round is completed.
              </p>
            </div>
            <button
              onClick={fetchPairings}
              className="ml-4 p-2 rounded-full hover:bg-amber-100 text-amber-700 
                dark:hover:bg-amber-800/50 dark:text-amber-300"
              title="Refresh projected pairings"
            >
              <ArrowPathIcon className="w-5 h-5" />
            </button>
          </div>
        </div>
        <div className="p-4 bg-white dark:bg-onyx-900">
          <EventRoundPairings
            eventId={eventId}
            currentRound={currentRound + 1}
            matches={projectedPairings}
            isLoading={isLoading}
            isProjected={true}
          />
        </div>
      </div>
    </div>
  );
}