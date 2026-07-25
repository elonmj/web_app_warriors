"use client";

import { useEffect, useState } from "react";
import { EventStatistics } from "@/types/EventStatistics";
import { ChartBarIcon, UsersIcon, TrophyIcon } from "@heroicons/react/24/outline";
import { Heading, Body } from "@/components/ui/Typography";

interface EventStatsProps {
  /** Stats de la ronde affichée — le résumé au-dessus couvre la même ronde. */
  stats: EventStatistics;
  eventId: string;
}

const perfCard =
  "bg-white p-4 rounded-lg border border-onyx-200 shadow-sm hover:shadow-md transition-all duration-200 dark:bg-onyx-900 dark:border-onyx-800";

const EventStats = ({ stats, eventId }: EventStatsProps) => {
  const [allRounds, setAllRounds] = useState<EventStatistics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/stats/event/${eventId}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (!cancelled) setAllRounds(data);
      })
      .catch(() => undefined)
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [eventId]);

  return (
    <div className="space-y-8">
      {/* Totaux toutes rondes — à distinguer du résumé de ronde affiché au-dessus */}
      <section>
        <Heading.H3 className="mb-1">Totaux de l&apos;événement</Heading.H3>
        <Body.Caption className="text-onyx-500 dark:text-onyx-400 mb-4 block">
          Toutes rondes confondues — le résumé au-dessus ne couvre que la ronde affichée.
        </Body.Caption>
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className={`${perfCard} h-24 animate-pulse`} />
            ))}
          </div>
        ) : allRounds ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className={perfCard}>
              <div className="flex items-center gap-2 mb-2">
                <TrophyIcon className="w-5 h-5 text-amethyste-500" />
                <Body.Label>PR moyen</Body.Label>
              </div>
              <Heading.H4>{allRounds.averagePR.toFixed(1)}</Heading.H4>
              <Body.Caption className="mt-1 text-onyx-600 dark:text-onyx-400">
                Points par match
              </Body.Caption>
            </div>
            <div className={perfCard}>
              <div className="flex items-center gap-2 mb-2">
                <ChartBarIcon className="w-5 h-5 text-amethyste-500" />
                <Body.Label>Spread moyen</Body.Label>
              </div>
              <Heading.H4>{allRounds.averageDS.toFixed(1)}</Heading.H4>
              <Body.Caption className="mt-1 text-onyx-600 dark:text-onyx-400">
                Écart moyen (plafonné ±100)
              </Body.Caption>
            </div>
            <div className={perfCard}>
              <div className="flex items-center gap-2 mb-2">
                <UsersIcon className="w-5 h-5 text-amethyste-500" />
                <Body.Label>Joueurs actifs</Body.Label>
              </div>
              <Heading.H4>{allRounds.activePlayers}</Heading.H4>
              <Body.Caption className="mt-1 text-onyx-600 dark:text-onyx-400">
                Sur l&apos;ensemble de l&apos;événement
              </Body.Caption>
            </div>
            <div className={perfCard}>
              <div className="flex items-center gap-2 mb-2">
                <ChartBarIcon className="w-5 h-5 text-amethyste-500" />
                <Body.Label>Cote moyenne</Body.Label>
              </div>
              <Heading.H4>{allRounds.averageRating.toFixed(0)}</Heading.H4>
              <Body.Caption className="mt-1 text-onyx-600 dark:text-onyx-400">
                Niveau moyen des joueurs
              </Body.Caption>
            </div>
          </div>
        ) : (
          <Body.Text className="text-onyx-500 dark:text-onyx-400">
            Totaux indisponibles.
          </Body.Text>
        )}
      </section>

      {/* Stats joueurs — participants de la ronde affichée */}
      {stats.playerStats.length > 0 && (
        <section>
          <Heading.H3 className="mb-4">
            Statistiques des joueurs (cette ronde)
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
                          Joueur
                        </th>
                        <th scope="col" className="px-4 py-3.5 text-center text-sm font-semibold text-onyx-900 dark:text-white">
                          Matchs
                        </th>
                        <th scope="col" className="px-4 py-3.5 text-center text-sm font-semibold text-onyx-900 dark:text-white">
                          V/D/N
                        </th>
                        <th scope="col" className="px-4 py-3.5 text-center text-sm font-semibold text-onyx-900 dark:text-white">
                          Spread moyen
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
