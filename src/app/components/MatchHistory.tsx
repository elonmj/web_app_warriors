import { PlayerMatch } from "@/lib/Player";
import { format } from "date-fns";
import Link from "next/link";

interface MatchHistoryProps {
  matches: PlayerMatch[];
  playerId: string;
}

export default function MatchHistory({ matches, playerId }: MatchHistoryProps) {
  return (
    <div className="overflow-hidden rounded-lg bg-white shadow dark:bg-gray-800">
      <div className="px-4 py-5 sm:px-6">
        <h3 className="text-lg font-medium leading-6 text-gray-900 dark:text-white">
          Match History
        </h3>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-900">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                Date
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                Opponent
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                Score
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                PR
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                Rating Change
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                Category
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white dark:divide-gray-700 dark:bg-gray-800">
            {matches.map((match, index) => {
              const [playerScore, opponentScore] = match.result.score;
              const isWin = playerScore > opponentScore;
              const isDraw = playerScore === opponentScore;

              return (
                <tr
                  key={`${match.date}-${match.opponent}`}
                  className={index % 2 === 0 ? "bg-white dark:bg-gray-800" : "bg-gray-50 dark:bg-gray-900"}
                >
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                    {format(new Date(match.date), "MMM d, yyyy")}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4">
                    <Link
                      href={`/player/${match.opponent}`}
                      className="text-sm font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                    >
                      Rating: {match.opponentRating}
                    </Link>
                  </td>
                  <td className="whitespace-nowrap px-6 py-4">
                    <span className={`text-sm font-medium
                      ${isWin 
                        ? "text-green-600 dark:text-green-400"
                        : isDraw
                          ? "text-gray-600 dark:text-gray-400"
                          : "text-red-600 dark:text-red-400"
                      }`}
                    >
                      {playerScore} - {opponentScore}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900 dark:text-gray-100">
                    {match.result.pr}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4">
                    <span className={`text-sm font-medium
                      ${match.ratingChange > 0
                        ? "text-green-600 dark:text-green-400"
                        : match.ratingChange < 0
                          ? "text-red-600 dark:text-red-400"
                          : "text-gray-600 dark:text-gray-400"
                      }`}
                    >
                      {match.ratingChange > 0 ? "+" : ""}
                      {match.ratingChange}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-6 py-4">
                    <span
                      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium
                        ${getCategoryStyle(match.categoryAtTime)}`}
                    >
                      {match.categoryAtTime}
                    </span>
                  </td>
                </tr>
              );
            })}
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