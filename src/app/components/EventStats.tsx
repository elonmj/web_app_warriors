import { EventStatistics } from "@/lib/Statistics";
import { PlayerCategory } from "@/types/Enums";

interface EventStatsProps {
  stats: EventStatistics;
}

export default function EventStats({ stats }: EventStatsProps) {
  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
      {/* General Stats */}
      <div className="rounded-lg bg-white p-6 shadow dark:bg-gray-800">
        <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">
          Total Matches
        </h3>
        <p className="mt-2 text-3xl font-semibold text-gray-900 dark:text-white">
          {stats.totalMatches}
        </p>
        <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
          {stats.completedMatches} completed
        </p>
      </div>

      <div className="rounded-lg bg-white p-6 shadow dark:bg-gray-800">
        <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">
          Active Players
        </h3>
        <p className="mt-2 text-3xl font-semibold text-gray-900 dark:text-white">
          {stats.activePlayers}
        </p>
      </div>

      <div className="rounded-lg bg-white p-6 shadow dark:bg-gray-800">
        <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">
          Average Rating
        </h3>
        <p className="mt-2 text-3xl font-semibold text-gray-900 dark:text-white">
          {stats.averageRating}
        </p>
      </div>

      <div className="rounded-lg bg-white p-6 shadow dark:bg-gray-800">
        <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">
          Average DS
        </h3>
        <p className="mt-2 text-3xl font-semibold text-gray-900 dark:text-white">
          {stats.averageDS}%
        </p>
      </div>
      {/*<div className="rounded-lg bg-white p-6 shadow dark:bg-gray-800">
        <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">
          Last Updated
        </h3>
        <p className="mt-2 text-3xl font-semibold text-gray-900 dark:text-white">
          {stats.lastUpdated ? new Date(stats.lastUpdated).toLocaleDateString() : "Invalid Date"}
        </p>
      </div>*/}
      <div className="sm:col-span-2 lg:col-span-4">
        <div className="rounded-lg bg-white p-6 shadow dark:bg-gray-800">
          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">
            Category Distribution
          </h3>
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {Object.values(PlayerCategory).map((category) => (
              <div key={category} className="flex items-center justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  {category}
                </span>
                <span className="font-semibold text-gray-900 dark:text-white">
                  {stats.categoryDistribution[category] || 0} players
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}