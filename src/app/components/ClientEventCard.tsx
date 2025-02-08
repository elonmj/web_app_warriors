"use client";

import { Event } from "@/types/Event";
import { EventStatus } from "@/types/Enums";
import { format } from "date-fns";
import Link from "next/link";

interface ClientEventCardProps {
  event: Event;
}

export default function ClientEventCard({ event }: ClientEventCardProps) {
  return (
    <div className="block rounded-lg border border-gray-200 bg-white p-6 shadow transition-shadow hover:shadow-md dark:border-gray-800 dark:bg-gray-800">
      <Link href={`/event/${event.id}`} className="block">
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
            {event.name}
          </h3>
          <span
            className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium
              ${
                event.status === "open"
                  ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
                  : "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300"
              }`}
          >
            {event.status === "open" ? "Open" : "Closed"}
          </span>
        </div>
        <div className="mt-4 text-sm text-gray-600 dark:text-gray-400">
          <div>
            Start: {format(new Date(event.startDate), "MMM d, yyyy")}
          </div>
          <div>
            End: {format(new Date(event.endDate), "MMM d, yyyy")}
          </div>
          {event.metadata && (
            <div className="mt-2 text-xs text-gray-500">
              <div>{event.metadata.totalPlayers} players</div>
              <div>{event.metadata.totalMatches} matches</div>
              <div>Round {event.metadata.currentRound}</div>
            </div>
          )}
        </div>
      </Link>
    </div>
  );
}