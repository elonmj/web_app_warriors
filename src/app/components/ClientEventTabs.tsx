"use client";

import TabNav from "./TabNav";
import EventMatchHistory from "./EventMatchHistory";
import { PlayerRankings } from "./PlayerRankings";
import EventStats from "./EventStats";
import ProjectedPairings from "./ProjectedPairings";
import { Match } from "@/types/Match";
import { Event } from "@/types/Event";
import { Player } from "@/types/Player";
import { EventRanking } from "@/types/Ranking";
import { EventStatistics } from "@/types/EventStatistics";

interface ClientEventTabsProps {
  event: Event;
  currentRound: number;
  roundMatches: Match[];
  roundRankings: EventRanking;
  stats: EventStatistics;
}

export default function ClientEventTabs({
  event,
  currentRound,
  roundMatches,
  roundRankings,
  stats
}: ClientEventTabsProps) {
  const handleRoundChange = (round: number) => {
    const params = new URLSearchParams(window.location.search);
    params.set('round', round.toString());
    window.location.search = params.toString();
  };

  return (
    <TabNav
      defaultTab="matches"
      currentRound={currentRound}
      totalRounds={event.metadata?.totalRounds || 0}
      onRoundChange={handleRoundChange}
      tabs={[
        {
          id: "matches",
          label: "Matches",
          content: (
            <div className="p-4">
              {roundMatches.length > 0 ? (
                <EventMatchHistory matches={roundMatches} />
              ) : (
                <div className="text-center py-8 text-onyx-500 dark:text-onyx-400">
                  No matches available for round {currentRound}
                </div>
              )}
            </div>
          ),
        },
        {
          id: "rankings",
          label: "Rankings",
          content: (
            <div className="rounded-lg border border-onyx-200 dark:border-onyx-800">
              <PlayerRankings
                eventRanking={roundRankings}
                currentRound={currentRound}
                totalRounds={event.metadata?.totalRounds || 0}
                onRoundChange={handleRoundChange}
              />
            </div>
          ),
        },
        {
          id: "statistics",
          label: "Statistics",
          content: (
            <div className="space-y-6 p-4">
              {/* Category Distribution */}
              <div>
                <h3 className="text-lg font-medium text-onyx-900 dark:text-white mb-4">
                  Player Categories
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {Object.entries(stats.categoryDistribution).map(([category, count]) => (
                    <div
                      key={category}
                      className="bg-onyx-50 rounded-lg p-4 dark:bg-onyx-800/50"
                    >
                      <div className="text-sm font-medium text-onyx-600 dark:text-onyx-300">
                        {category}
                      </div>
                      <div className="mt-1 text-2xl font-semibold text-onyx-900 dark:text-white">
                        {count}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Detailed Stats */}
              <EventStats stats={stats} />
            </div>
          ),
        },
        {
          id: "pairings",
          label: "Next Round",
          content: (
            <div className="p-4">
              <ProjectedPairings
                eventId={event.id}
                currentRound={currentRound}
              />
            </div>
          ),
        }
      ]}
    />
  );
}