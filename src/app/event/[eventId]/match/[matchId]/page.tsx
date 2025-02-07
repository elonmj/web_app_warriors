import { Match } from "@/lib/Match";
import { Player } from "@/lib/Player";
import MatchResultForm from "@/app/components/MatchResultForm";
import Link from "next/link";
import { format } from "date-fns";

// Mock data for development - will be replaced with actual API calls
const mockMatch: Match = {
  id: "match-1",
  date: new Date().toISOString(),
  player1: "player-1",
  player2: "player-2",
  player1Rating: 1200,
  player2Rating: 1350,
  player1Category: "ONYX",
  player2Category: "AMÉTHYSTE",
  status: "pending",
  isRandom: false,
  eventId: "event-1",
};

const mockPlayer1: Player = {
  id: "player-1",
  name: "John Doe",
  currentRating: 1200,
  category: "ONYX",
  matches: [],
  statistics: {
    totalMatches: 10,
    wins: 5,
    draws: 2,
    losses: 3,
    totalPR: 17,
    averageDS: 45.5,
    inactivityWeeks: 0,
  },
};

const mockPlayer2: Player = {
  id: "player-2",
  name: "Jane Smith",
  currentRating: 1350,
  category: "AMÉTHYSTE",
  matches: [],
  statistics: {
    totalMatches: 15,
    wins: 8,
    draws: 3,
    losses: 4,
    totalPR: 27,
    averageDS: 52.3,
    inactivityWeeks: 0,
  },
};

export default function MatchResultPage({
  params,
}: {
  params: { eventId: string; matchId: string };
}) {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white shadow dark:bg-gray-800">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                Match Result Entry
              </h1>
              <div className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                {format(new Date(mockMatch.date), "MMMM d, yyyy")}
              </div>
            </div>
            <Link
              href={`/event/${params.eventId}`}
              className="rounded-md bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
            >
              Back to Event
            </Link>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="space-y-8">
          {/* Match Status */}
          <div className="rounded-lg bg-white p-6 shadow dark:bg-gray-800">
            <h2 className="text-lg font-medium text-gray-900 dark:text-white">
              Match Status
            </h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div>
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  Status
                </span>
                <p className="mt-1 text-sm font-medium text-gray-900 dark:text-white">
                  {mockMatch.status.charAt(0).toUpperCase() + mockMatch.status.slice(1)}
                </p>
              </div>
              {mockMatch.result?.validation && (
                <>
                  <div>
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      Player 1 Approval
                    </span>
                    <p className="mt-1 text-sm font-medium text-gray-900 dark:text-white">
                      {mockMatch.result.validation.player1Approved ? "Approved" : "Pending"}
                    </p>
                  </div>
                  <div>
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      Player 2 Approval
                    </span>
                    <p className="mt-1 text-sm font-medium text-gray-900 dark:text-white">
                      {mockMatch.result.validation.player2Approved ? "Approved" : "Pending"}
                    </p>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Match Result Form */}
          {mockMatch.status === "pending" && (
            <MatchResultForm
              match={mockMatch}
              player1={mockPlayer1}
              player2={mockPlayer2}
              onSubmit={async (score) => {
                // This will be replaced with actual API call
                console.log("Submitting score:", score);
              }}
            />
          )}

          {/* Result Display */}
          {mockMatch.result && (
            <div className="rounded-lg bg-white p-6 shadow dark:bg-gray-800">
              <h2 className="text-lg font-medium text-gray-900 dark:text-white">
                Match Result
              </h2>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <div>
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    {mockPlayer1.name}
                  </span>
                  <p className="mt-1 text-2xl font-semibold text-gray-900 dark:text-white">
                    {mockMatch.result.score[0]}
                  </p>
                </div>
                <div>
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    {mockPlayer2.name}
                  </span>
                  <p className="mt-1 text-2xl font-semibold text-gray-900 dark:text-white">
                    {mockMatch.result.score[1]}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}