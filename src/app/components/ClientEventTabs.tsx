"use client";

import TabNav from "./TabNav";
import EventRoundPairings from "./EventRoundPairings";
import { PlayerRankings } from "./PlayerRankings";
import EventStats from "./EventStats";
import ProjectedPairings from "./ProjectedPairings";
import StatsOverview from "./StatsOverview";
import { MatchDisplay } from "@/types/MatchHistory";
import { Event } from "@/types/Event";
import { EventRanking } from "@/types/Ranking";
import { EventStatistics } from "@/types/EventStatistics";
import { Body } from "@/components/ui/Typography";

interface ClientEventTabsProps {
  event: Event;
  currentRound: number;
  roundMatches: MatchDisplay[];
  roundRankings: EventRanking;
  stats: EventStatistics;
  isAdmin: boolean;
}

export default function ClientEventTabs({
  event,
  currentRound,
  roundMatches,
  roundRankings,
  stats,
  isAdmin
}: ClientEventTabsProps) {
  const handleRoundChange = (round: number) => {
    const params = new URLSearchParams(window.location.search);
    params.set('round', round.toString());
    window.location.search = params.toString();
  };

  return (
    <TabNav
      defaultTab="matches"
      tabs={[
        {
          id: "matches",
          label: "Appariements",
          content: (
            <div className="p-3 sm:p-4">
              <EventRoundPairings
                eventId={event.id}
                currentRound={currentRound}
                matches={roundMatches}
                isAdmin={isAdmin}
              />
            </div>
          ),
        },
        {
          id: "rankings",
          label: "Classement",
          content: (
            <PlayerRankings
              eventRanking={roundRankings}
              currentRound={currentRound}
              totalRounds={event.metadata?.totalRounds || 0}
              onRoundChange={handleRoundChange}
            />
          ),
        },
        {
          id: "statistics",
          label: "Stats",
          content: (
            <div className="space-y-6 p-3 sm:p-4">
              <div>
                <Body.Caption className="mb-2 block">
                  Résumé de la ronde {currentRound} — les totaux toutes rondes sont plus bas.
                </Body.Caption>
                <StatsOverview stats={stats} />
              </div>

              {/* Category Distribution */}
              <div>
                <h3 className="text-lg font-medium text-onyx-900 dark:text-white mb-4">
                  Catégories des joueurs
                </h3>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-2 lg:grid-cols-4 sm:gap-4">
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
              <EventStats stats={stats} eventId={event.id} />
            </div>
          ),
        },
        {
          id: "pairings",
          label: "Ronde +1",
          content: (
            <div className="p-3 sm:p-4">
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
