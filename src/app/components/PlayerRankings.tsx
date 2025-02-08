import { EventRanking } from "@/types/Ranking";
import Link from "next/link";

interface PlayerRankingsProps {
  eventRanking: EventRanking | null;
}

export default function PlayerRankings({ eventRanking }: PlayerRankingsProps) {
  if (!eventRanking || !eventRanking.rankings) {
    return (
      <div className="mt-8 rounded-lg bg-white p-4 text-center shadow dark:bg-gray-800">
        <p className="text-gray-500 dark:text-gray-400">No rankings available.</p>
      </div>
    );
  }

  return (
    <div className="mt-8 overflow-hidden rounded-lg bg-white shadow dark:bg-gray-800">
      <div className="px-4 py-5 sm:px-6">
        <h3 className="text-lg font-medium leading-6 text-gray-900 dark:text-white">
          Current Rankings
        </h3>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Last updated: {new Date(eventRanking.lastUpdated).toLocaleString()}
        </p>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-900">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                Rank
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                Player
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                Category
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                Rating
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                Points
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                W/D/L
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white dark:divide-gray-700 dark:bg-gray-800">
            {eventRanking.rankings.map((player, index) => (
              <tr
                key={player.playerId}
                className={index % 2 === 0 ? "bg-white dark:bg-gray-800" : "bg-gray-50 dark:bg-gray-900"}
              >
                <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-gray-900 dark:text-gray-100">
                  {player.rank}
                </td>
                <td className="whitespace-nowrap px-6 py-4">
                  <Link
                    href={`/player/${player.playerId}`}
                    className="text-sm font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                  >
                    {player.playerDetails?.name || 'Unknown'}
                  </Link>
                </td>
                <td className="whitespace-nowrap px-6 py-4">
                  <span
                    className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium
                      ${getCategoryStyle(player.category)}`}
                  >
                    {player.category}
                  </span>
                </td>
                <td className="whitespace-nowrap px-6 py-4">
                  <div className="flex items-center">
                    <span className="text-sm text-gray-900 dark:text-gray-100">
                      {player.rating}
                    </span>
                    {player.ratingChange !== 0 && (
                      <span 
                        className={`ml-2 text-xs ${
                          player.ratingChange > 0 
                            ? 'text-green-600 dark:text-green-400' 
                            : 'text-red-600 dark:text-red-400'
                        }`}
                      >
                        {player.ratingChange > 0 ? '+' : ''}{player.ratingChange}
                      </span>
                    )}
                  </div>
                </td>
                <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900 dark:text-gray-100">
                  {player.points}
                </td>
                <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                  {player.wins}/{player.draws}/{player.losses}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
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