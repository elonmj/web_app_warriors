import PlayerStats from "@/app/components/PlayerStats";
import MatchHistory from "@/app/components/MatchHistory";
import { Player } from "@/lib/Player";
import Link from "next/link";

// Mock player data for development
const mockPlayer: Player = {
  id: "player-1",
  name: "John Doe",
  currentRating: 1450,
  category: "AMÉTHYSTE",
  statistics: {
    totalMatches: 25,
    wins: 15,
    draws: 5,
    losses: 5,
    totalPR: 55,
    averageDS: 62.5,
    inactivityWeeks: 1,
  },
  matches: [
    {
      date: "2025-02-06",
      opponent: "player-2",
      opponentRating: 1380,
      result: {
        score: [450, 380],
        pr: 3,
        pdi: 3,
        ds: 18.4,
      },
      ratingChange: 15,
      categoryAtTime: "AMÉTHYSTE",
    },
    {
      date: "2025-02-01",
      opponent: "player-3",
      opponentRating: 1520,
      result: {
        score: [420, 450],
        pr: 1,
        pdi: 1,
        ds: 7.1,
      },
      ratingChange: -8,
      categoryAtTime: "AMÉTHYSTE",
    },
    {
      date: "2025-01-28",
      opponent: "player-4",
      opponentRating: 1420,
      result: {
        score: [400, 400],
        pr: 2,
        pdi: 2,
        ds: 0,
      },
      ratingChange: 0,
      categoryAtTime: "ONYX",
    },
    // Add more match history as needed
  ],
};

export default function PlayerProfilePage({
  params,
}: {
  params: { playerId: string };
}) {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white shadow dark:bg-gray-800">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                {mockPlayer.name}
              </h1>
              <div className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                Player ID: {mockPlayer.id}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="space-y-8">
          {/* Statistics Section */}
          <section>
            <h2 className="mb-4 text-2xl font-bold text-gray-900 dark:text-white">
              Player Statistics
            </h2>
            <PlayerStats player={mockPlayer} />
          </section>

          {/* Match History Section */}
          <section>
            <h2 className="mb-4 text-2xl font-bold text-gray-900 dark:text-white">
              Match History
            </h2>
            <MatchHistory matches={mockPlayer.matches} playerId={mockPlayer.id} />
          </section>
        </div>
      </div>
    </div>
  );
}