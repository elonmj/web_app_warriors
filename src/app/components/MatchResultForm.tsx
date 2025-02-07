"use client";

import { Match, MatchScore } from "@/lib/Match";
import { Player } from "@/lib/Player";
import { useState } from "react";

interface MatchResultFormProps {
  match: Match;
  player1: Player;
  player2: Player;
  onSubmit: (score: MatchScore) => void;
}

export default function MatchResultForm({
  match,
  player1,
  player2,
  onSubmit,
}: MatchResultFormProps) {
  const [score, setScore] = useState<MatchScore>({
    player1Score: 0,
    player2Score: 0,
  });
  const [error, setError] = useState<string>("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Basic validation
    if (score.player1Score < 0 || score.player2Score < 0) {
      setError("Scores cannot be negative");
      return;
    }

    if (score.player1Score === 0 && score.player2Score === 0) {
      setError("At least one player must score points");
      return;
    }

    // Clear any previous errors and submit
    setError("");
    onSubmit(score);
  };

  return (
    <div className="rounded-lg bg-white p-6 shadow dark:bg-gray-800">
      <h2 className="text-lg font-medium text-gray-900 dark:text-white">
        Enter Match Result
      </h2>
      
      <form onSubmit={handleSubmit} className="mt-6 space-y-6">
        <div className="grid gap-6 md:grid-cols-2">
          {/* Player 1 Score */}
          <div>
            <label
              htmlFor="player1Score"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              {player1.name}&apos;s Score
              <span className="ml-2 text-xs text-gray-500">
                ({match.player1Category})
              </span>
            </label>
            <input
              type="number"
              id="player1Score"
              min="0"
              value={score.player1Score}
              onChange={(e) =>
                setScore((prev) => ({
                  ...prev,
                  player1Score: parseInt(e.target.value) || 0,
                }))
              }
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white sm:text-sm"
            />
          </div>

          {/* Player 2 Score */}
          <div>
            <label
              htmlFor="player2Score"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              {player2.name}&apos;s Score
              <span className="ml-2 text-xs text-gray-500">
                ({match.player2Category})
              </span>
            </label>
            <input
              type="number"
              id="player2Score"
              min="0"
              value={score.player2Score}
              onChange={(e) =>
                setScore((prev) => ({
                  ...prev,
                  player2Score: parseInt(e.target.value) || 0,
                }))
              }
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white sm:text-sm"
            />
          </div>
        </div>

        {error && (
          <div className="rounded-md bg-red-50 p-4 dark:bg-red-900">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg
                  className="h-5 w-5 text-red-400"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-700 dark:text-red-200">{error}</p>
              </div>
            </div>
          </div>
        )}

        <div className="flex justify-end">
          <button
            type="submit"
            className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            Submit Result
          </button>
        </div>
      </form>
    </div>
  );
}