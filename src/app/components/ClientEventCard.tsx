"use client";

import { Event } from "@/types/Event";
import { format } from "date-fns";
import Link from "next/link";
import { CalendarIcon, UserGroupIcon, PlayIcon } from "@heroicons/react/24/outline";
import { Heading, Body } from "@/components/ui/Typography";

interface ClientEventCardProps {
  event: Event;
}

export default function ClientEventCard({ event }: ClientEventCardProps) {
  const getStatusDisplay = (status: string) => {
    switch (status) {
      case "open":
        return {
          text: "Active",
          classes: "bg-green-100 text-green-800 ring-1 ring-green-600/20 dark:bg-green-900/30 dark:text-green-200"
        };
      case "in_progress":
        return {
          text: "In Progress",
          classes: "bg-yellow-100 text-yellow-800 ring-1 ring-yellow-600/20 dark:bg-yellow-900/30 dark:text-yellow-200"
        };
      case "closed":
        return {
          text: "Closed",
          classes: "bg-onyx-100 text-onyx-800 ring-1 ring-onyx-600/20 dark:bg-onyx-800 dark:text-onyx-200"
        };
      default:
        return {
          text: "Unknown",
          classes: "bg-onyx-100 text-onyx-800 ring-1 ring-onyx-600/20 dark:bg-onyx-800 dark:text-onyx-200"
        };
    }
  };

  const status = getStatusDisplay(event.status);

  return (
    <div 
      className="block rounded-lg border border-onyx-200 bg-white
        p-4 sm:p-6 shadow-sm
        transition-all duration-200
        hover:shadow-md hover:border-amethyste-200 hover:-translate-y-0.5
        dark:border-onyx-800 dark:bg-onyx-900 dark:hover:border-amethyste-700"
    >
      <Link href={`/event/${event.id}`} className="block space-y-4">
        <div className="flex items-center justify-between">
          <Heading.H3>
            {event.name}
          </Heading.H3>
          <span
            className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium 
              transition-colors duration-150 ${status.classes}`}
          >
            {status.text}
          </span>
        </div>

        <div className="space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
            <div className="flex items-center gap-2 text-onyx-600 dark:text-onyx-300">
              <CalendarIcon className="w-4 h-4" />
              <Body.Text variant="sm">
                Start: {format(new Date(event.startDate), "MMM d, yyyy")}
              </Body.Text>
            </div>
            <div className="flex items-center gap-2 text-onyx-600 dark:text-onyx-300">
              <CalendarIcon className="w-4 h-4" />
              <Body.Text variant="sm">
                End: {format(new Date(event.endDate), "MMM d, yyyy")}
              </Body.Text>
            </div>
          </div>

          {event.metadata && (
            <div className="pt-3 mt-3 border-t border-onyx-100 dark:border-onyx-800">
              <div className="grid grid-cols-3 gap-4">
                <div className="flex items-center gap-2">
                  <UserGroupIcon className="w-4 h-4 text-onyx-400" />
                  <Body.Caption>
                    {event.metadata.totalPlayers} players
                  </Body.Caption>
                </div>
                <div className="flex items-center gap-2">
                  <PlayIcon className="w-4 h-4 text-onyx-400" />
                  <Body.Caption>
                    {event.metadata.totalMatches} matches
                  </Body.Caption>
                </div>
                <div className="flex items-center gap-2">
                  <Body.Caption className="font-medium">
                    R{event.metadata.currentRound}
                  </Body.Caption>
                </div>
              </div>
            </div>
          )}
        </div>
      </Link>
    </div>
  );
}
