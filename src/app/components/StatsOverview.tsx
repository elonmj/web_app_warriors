"use client";

import { EventStatistics } from "@/types/EventStatistics";
import {
  ChartBarIcon,
  UserGroupIcon,
  PlayCircleIcon,
  TrophyIcon
} from "@heroicons/react/24/outline";

interface StatsOverviewProps {
  stats: EventStatistics;
}

export default function StatsOverview({ stats }: StatsOverviewProps) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
      {/* Active Matches */}
      <div className="rounded-lg border border-onyx-200 bg-white p-4 
        shadow-sm hover:shadow-md transition-all duration-200
        dark:border-onyx-800 dark:bg-onyx-900">
        <div className="flex items-center gap-2">
          <PlayCircleIcon className="w-5 h-5 text-amethyste-500" />
          <h3 className="text-sm font-medium text-onyx-900 dark:text-white">
            Matchs en cours
          </h3>
        </div>
        <p className="mt-2 text-2xl font-semibold text-onyx-900 dark:text-white">
          {stats.matchesInProgress}
        </p>
        <p className="mt-1 text-sm text-onyx-500 dark:text-onyx-400">
          Pas encore joués
        </p>
      </div>

      {/* Total Matches */}
      <div className="rounded-lg border border-onyx-200 bg-white p-4 
        shadow-sm hover:shadow-md transition-all duration-200
        dark:border-onyx-800 dark:bg-onyx-900">
        <div className="flex items-center gap-2">
          <ChartBarIcon className="w-5 h-5 text-amethyste-500" />
          <h3 className="text-sm font-medium text-onyx-900 dark:text-white">
            Matchs de la ronde
          </h3>
        </div>
        <p className="mt-2 text-2xl font-semibold text-onyx-900 dark:text-white">
          {stats.totalMatches}
        </p>
        <div className="mt-1 text-sm text-onyx-500 dark:text-onyx-400">
          <span>{stats.completedMatches} terminés</span>
        </div>
      </div>

      {/* Players */}
      <div className="rounded-lg border border-onyx-200 bg-white p-4 
        shadow-sm hover:shadow-md transition-all duration-200
        dark:border-onyx-800 dark:bg-onyx-900">
        <div className="flex items-center gap-2">
          <UserGroupIcon className="w-5 h-5 text-amethyste-500" />
          <h3 className="text-sm font-medium text-onyx-900 dark:text-white">
            Joueurs
          </h3>
        </div>
        <p className="mt-2 text-2xl font-semibold text-onyx-900 dark:text-white">
          {stats.activePlayers}
        </p>
        <div className="mt-1 text-sm text-onyx-500 dark:text-onyx-400">
          <span>Participants actifs</span>
        </div>
      </div>

      {/* Performance */}
      <div className="rounded-lg border border-onyx-200 bg-white p-4 
        shadow-sm hover:shadow-md transition-all duration-200
        dark:border-onyx-800 dark:bg-onyx-900">
        <div className="flex items-center gap-2">
          <TrophyIcon className="w-5 h-5 text-amethyste-500" />
          <h3 className="text-sm font-medium text-onyx-900 dark:text-white">
            Performance
          </h3>
        </div>
        <p className="mt-2 text-2xl font-semibold text-onyx-900 dark:text-white">
          {stats.averageDS.toFixed(1)}
        </p>
        <div className="mt-1 text-sm text-onyx-500 dark:text-onyx-400 space-y-1">
          <div>Spread moyen</div>
          <div>PR : {stats.averagePR.toFixed(1)}</div>
          <div>Cote : {stats.averageRating.toFixed(0)}</div>
        </div>
      </div>
    </div>
  );
}