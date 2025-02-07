import { Player, PlayerStatistics } from "@/lib/Player";

interface PlayerStatsProps {
  player: Player;
}

export default function PlayerStats({ player }: PlayerStatsProps) {
  const stats = player.statistics;
  
  // Calculate win rate
  const winRate = stats.totalMatches > 0
    ? Math.round((stats.wins / stats.totalMatches) * 100)
    : 0;
  
  // Calculate average PR per match
  const averagePR = stats.totalMatches > 0
    ? Math.round((stats.totalPR / stats.totalMatches) * 10) / 10
    : 0;

  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
      {/* Rating Card */}
      <div className="rounded-lg bg-white p-6 shadow dark:bg-gray-800">
        <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">
          Current Rating
        </h3>
        <p className="mt-2 text-3xl font-semibold text-gray-900 dark:text-white">
          {player.currentRating}
        </p>
        <span
          className={`mt-2 inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium
            ${getCategoryStyle(player.category)}`}
        >
          {player.category}
        </span>
      </div>

      {/* Matches Card */}
      <div className="rounded-lg bg-white p-6 shadow dark:bg-gray-800">
        <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">
          Total Matches
        </h3>
        <p className="mt-2 text-3xl font-semibold text-gray-900 dark:text-white">
          {stats.totalMatches}
        </p>
        <div className="mt-2 text-sm text-gray-600 dark:text-gray-400">
          {stats.wins}W - {stats.draws}D - {stats.losses}L
        </div>
      </div>

      {/* Win Rate Card */}
      <div className="rounded-lg bg-white p-6 shadow dark:bg-gray-800">
        <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">
          Win Rate
        </h3>
        <p className="mt-2 text-3xl font-semibold text-gray-900 dark:text-white">
          {winRate}%
        </p>
        <div className="mt-2 text-sm text-gray-600 dark:text-gray-400">
          Over {stats.totalMatches} matches
        </div>
      </div>

      {/* Performance Card */}
      <div className="rounded-lg bg-white p-6 shadow dark:bg-gray-800">
        <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">
          Average Performance
        </h3>
        <p className="mt-2 text-3xl font-semibold text-gray-900 dark:text-white">
          {averagePR}
        </p>
        <div className="mt-2 text-sm text-gray-600 dark:text-gray-400">
          PR per match
        </div>
      </div>

      {/* Additional Stats */}
      <div className="sm:col-span-2 lg:col-span-4">
        <div className="rounded-lg bg-white p-6 shadow dark:bg-gray-800">
          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">
            Detailed Statistics
          </h3>
          <div className="mt-4 grid gap-4 sm:grid-cols-3">
            <div>
              <span className="text-sm text-gray-500 dark:text-gray-400">
                Average DS
              </span>
              <p className="mt-1 text-lg font-medium text-gray-900 dark:text-white">
                {stats.averageDS}%
              </p>
            </div>
            <div>
              <span className="text-sm text-gray-500 dark:text-gray-400">
                Total PR
              </span>
              <p className="mt-1 text-lg font-medium text-gray-900 dark:text-white">
                {stats.totalPR}
              </p>
            </div>
            <div>
              <span className="text-sm text-gray-500 dark:text-gray-400">
                Inactivity
              </span>
              <p className="mt-1 text-lg font-medium text-gray-900 dark:text-white">
                {stats.inactivityWeeks} weeks
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function getCategoryStyle(category: string): string {
  switch (category) {
    case "DIAMANT":
      return "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300";
    case "TOPAZE":
      return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300";
    case "AMÉTHYSTE":
      return "bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-300";
    case "ONYX":
    default:
      return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300";
  }
}