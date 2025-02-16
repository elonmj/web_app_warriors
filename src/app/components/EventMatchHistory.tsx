"use client";

import { format } from "date-fns";
import Link from "next/link";
import { TrophyIcon, ClockIcon } from "@heroicons/react/24/outline";
import { Body, Heading } from "@/components/ui/Typography";
import { getCategoryColor } from "./utils/styles";
import { MatchDisplay } from "@/types/MatchHistory";

interface EventMatchHistoryProps {
  matches: MatchDisplay[];
}

const EventMatchHistory = ({ matches }: EventMatchHistoryProps) => {
  if (!matches.length) {
    return (
      <div className="text-center py-12">
        <div className="mx-auto w-12 h-12 rounded-full bg-onyx-100 flex items-center justify-center mb-4
          dark:bg-onyx-800">
          <TrophyIcon className="w-6 h-6 text-onyx-400" />
        </div>
        <Body.Text className="text-onyx-600 dark:text-onyx-400">
          No matches found
        </Body.Text>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {matches.map((match) => (
        <Link 
          key={match.id} 
          href={`/event/${match.eventId}/match/${match.id}`}
          className="block rounded-lg border border-onyx-200 bg-white p-4 sm:p-6
            hover:border-amethyste-200 hover:shadow-sm transition-all duration-200
            dark:bg-onyx-900 dark:border-onyx-800 dark:hover:border-amethyste-700"
        >
          {/* Match Header */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2 text-onyx-500 dark:text-onyx-400">
              <ClockIcon className="w-4 h-4" />
              <Body.Caption>
                {format(new Date(match.date), "MMM d, yyyy")}
              </Body.Caption>
            </div>
            <div className={`flex items-center gap-2 ${
              match.status === "completed" ? "text-green-600 dark:text-green-400" : "text-onyx-500 dark:text-onyx-400"
            }`}>
              <Body.Caption className="font-medium">
                {match.status === "completed" ? "Completed" : "In Progress"}
              </Body.Caption>
            </div>
          </div>

          {/* Match Content */}
          <div className="grid grid-cols-1 sm:grid-cols-[1fr,auto,1fr] gap-4 items-center">
            {/* Player 1 */}
            <div className="text-center sm:text-left">
              <Body.Text className="font-medium">
                {match.player1Details.name}
              </Body.Text>
              <Body.Caption className={getCategoryColor(match.player1Details.category)}>
                {match.player1Details.category}
              </Body.Caption>
            </div>

            {/* Score */}
            <div className="flex items-center justify-center gap-3">
              {match.result ? (
                <>
                  <Heading.H3 className="text-onyx-900 dark:text-white">
                    {match.result.score[0]}
                  </Heading.H3>
                  <Body.Text className="text-onyx-400">vs</Body.Text>
                  <Heading.H3 className="text-onyx-900 dark:text-white">
                    {match.result.score[1]}
                  </Heading.H3>
                </>
              ) : (
                <Body.Text className="text-onyx-400">vs</Body.Text>
              )}
            </div>

            {/* Player 2 */}
            <div className="text-center sm:text-right">
              <Body.Text className="font-medium">
                {match.player2Details.name}
              </Body.Text>
              <Body.Caption className={getCategoryColor(match.player2Details.category)}>
                {match.player2Details.category}
              </Body.Caption>
            </div>
          </div>

          {/* Match Stats */}
          {match.result && (
            <div className="mt-4 pt-4 border-t border-onyx-100 dark:border-onyx-800">
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center">
                  <Body.Caption>PR</Body.Caption>
                  <Body.Text className="font-medium text-onyx-900 dark:text-white">
                    {match.result.pr}
                  </Body.Text>
                </div>
                <div className="text-center">
                  <Body.Caption>PDI</Body.Caption>
                  <Body.Text className="font-medium text-onyx-900 dark:text-white">
                    {(match.result.pdi * 100).toFixed(0)}%
                  </Body.Text>
                </div>
                <div className="text-center">
                  <Body.Caption>DS</Body.Caption>
                  <Body.Text className="font-medium text-onyx-900 dark:text-white">
                    {match.result.ds}
                  </Body.Text>
                </div>
              </div>
            </div>
          )}
        </Link>
      ))}
    </div>
  );
};

export default EventMatchHistory;