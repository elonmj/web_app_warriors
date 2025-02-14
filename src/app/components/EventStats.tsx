"use client";

import { EventStatistics } from "@/types/EventStatistics";
import { ChartBarIcon, UsersIcon, TrophyIcon } from "@heroicons/react/24/outline";
import { Heading, Body } from "@/components/ui/Typography";

interface EventStatsProps {
  stats: EventStatistics;
}

const EventStats = ({ stats }: EventStatsProps) => {
  return (
    <div className="space-y-8">
      {/* Performance Stats */}
      <section>
        <Heading.H3 className="mb-4">
          Performance Statistics
        </Heading.H3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-lg border border-onyx-200 
            shadow-sm hover:shadow-md transition-all duration-200
            dark:bg-onyx-900 dark:border-onyx-800">
            <div className="flex items-center gap-2 mb-2">
              <TrophyIcon className="w-5 h-5 text-amethyste-500" />
              <Body.Label>Average PR</Body.Label>
            </div>
            <Heading.H4>{stats.averagePR.toFixed(1)}</Heading.H4>
            <Body.Caption className="mt-1 text-onyx-600 dark:text-onyx-400">
              Points per match
            </Body.Caption>
          </div>

          <div className="bg-white p-4 rounded-lg border border-onyx-200 
            shadow-sm hover:shadow-md transition-all duration-200
            dark:bg-onyx-900 dark:border-onyx-800">
            <div className="flex items-center gap-2 mb-2">
              <ChartBarIcon className="w-5 h-5 text-amethyste-500" />
              <Body.Label>Average DS</Body.Label>
            </div>
            <Heading.H4>{stats.averageDS.toFixed(1)}</Heading.H4>
            <Body.Caption className="mt-1 text-onyx-600 dark:text-onyx-400">
              Dominance score
            </Body.Caption>
          </div>

          <div className="bg-white p-4 rounded-lg border border-onyx-200 
            shadow-sm hover:shadow-md transition-all duration-200
            dark:bg-onyx-900 dark:border-onyx-800">
            <div className="flex items-center gap-2 mb-2">
              <UsersIcon className="w-5 h-5 text-amethyste-500" />
              <Body.Label>Active Players</Body.Label>
            </div>
            <Heading.H4>{stats.activePlayers}</Heading.H4>
            <Body.Caption className="mt-1 text-onyx-600 dark:text-onyx-400">
              Participating players
            </Body.Caption>
          </div>

          <div className="bg-white p-4 rounded-lg border border-onyx-200 
            shadow-sm hover:shadow-md transition-all duration-200
            dark:bg-onyx-900 dark:border-onyx-800">
            <div className="flex items-center gap-2 mb-2">
              <ChartBarIcon className="w-5 h-5 text-amethyste-500" />
              <Body.Label>Average Rating</Body.Label>
            </div>
            <Heading.H4>{stats.averageRating.toFixed(0)}</Heading.H4>
            <Body.Caption className="mt-1 text-onyx-600 dark:text-onyx-400">
              Player skill level
            </Body.Caption>
          </div>
        </div>
      </section>

      {/* Player Stats */}
      {stats.playerStats.length > 0 && (
        <section>
          <Heading.H3 className="mb-4">
            Player Statistics
          </Heading.H3>
          <div className="overflow-hidden rounded-lg border border-onyx-200 bg-white 
            dark:border-onyx-800 dark:bg-onyx-900">
            <div className="flow-root">
              <div className="overflow-x-auto">
                <div className="inline-block min-w-full align-middle">
                  <table className="min-w-full divide-y divide-onyx-200 dark:divide-onyx-800">
                    <thead>
                      <tr className="bg-onyx-50 dark:bg-onyx-800/50">
                        <th scope="col" className="px-4 py-3.5 text-left text-sm font-semibold text-onyx-900 dark:text-white">
                          Player
                        </th>
                        <th scope="col" className="px-4 py-3.5 text-center text-sm font-semibold text-onyx-900 dark:text-white">
                          Matches
                        </th>
                        <th scope="col" className="px-4 py-3.5 text-center text-sm font-semibold text-onyx-900 dark:text-white">
                          W/L/D
                        </th>
                        <th scope="col" className="px-4 py-3.5 text-center text-sm font-semibold text-onyx-900 dark:text-white">
                          Avg DS
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-onyx-200 dark:divide-onyx-800">
                      {stats.playerStats.map((player) => (
                        <tr 
                          key={player.playerId}
                          className="hover:bg-onyx-50 dark:hover:bg-onyx-800/50 transition-colors"
                        >
                          <td className="whitespace-nowrap px-4 py-4">
                            <Body.Text className="font-medium">
                              {player.name}
                            </Body.Text>
                          </td>
                          <td className="whitespace-nowrap px-4 py-4 text-center">
                            <Body.Text>
                              {player.matches}
                            </Body.Text>
                          </td>
                          <td className="whitespace-nowrap px-4 py-4 text-center">
                            <Body.Text>
                              {player.wins}/{player.losses}/{player.draws}
                            </Body.Text>
                          </td>
                          <td className="whitespace-nowrap px-4 py-4 text-center">
                            <Body.Text>
                              {player.averageDS.toFixed(1)}
                            </Body.Text>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}
    </div>
  );
};

export default EventStats;