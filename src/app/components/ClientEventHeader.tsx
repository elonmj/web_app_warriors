"use client";

import { Event } from "@/types/Event";
import { EventStatus } from "@/types/Enums";
import { format } from "date-fns";
import { CalendarIcon, UsersIcon, PlusIcon, PencilIcon } from "@heroicons/react/24/outline";
import { Heading, Body } from "@/components/ui/Typography";

interface ClientEventHeaderProps {
  event: Event;
}

export default function ClientEventHeader({ event }: ClientEventHeaderProps) {
  const isOpen = event.status === EventStatus.OPEN;

  return (
    <div className="relative">
      {/* Background with gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-r from-amethyste-500/10 to-amethyste-600/10 
        dark:from-amethyste-900/20 dark:to-amethyste-800/20" />
      
      <div className="relative mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-3">
            <Heading.H1>{event.name}</Heading.H1>
            
            {/* Event Status */}
            <div className="flex flex-wrap items-center gap-3">
              <span className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-medium
                ${isOpen
                  ? "bg-green-100 text-green-800 ring-1 ring-green-600/20 dark:bg-green-900/30 dark:text-green-200"
                  : "bg-onyx-100 text-onyx-800 ring-1 ring-onyx-600/20 dark:bg-onyx-800 dark:text-onyx-200"
                }`}
              >
                {isOpen ? "Active" : "Closed"}
              </span>
              
              {/* Event Type Badge */}
              <span className="inline-flex items-center rounded-full px-3 py-1 text-sm font-medium
                bg-amethyste-100 text-amethyste-800 ring-1 ring-amethyste-600/20 
                dark:bg-amethyste-900/30 dark:text-amethyste-200"
              >
                {event.type}
              </span>
            </div>
          </div>
          
          {/* Action Buttons */}
          <div className="flex flex-wrap gap-3">
            <button className="inline-flex items-center rounded-md bg-white px-3 py-2 text-sm font-semibold 
              text-onyx-900 shadow-sm ring-1 ring-inset ring-onyx-300 hover:bg-onyx-50 
              dark:bg-onyx-800 dark:text-white dark:ring-onyx-700 dark:hover:bg-onyx-700 
              transition-colors gap-2"
            >
              <PencilIcon className="w-4 h-4" />
              <span>Edit Event</span>
            </button>
            <button className="inline-flex items-center rounded-md bg-amethyste-500 px-3 py-2 text-sm 
              font-semibold text-white shadow-sm hover:bg-amethyste-600 focus:outline-none 
              focus:ring-2 focus:ring-amethyste-500 focus:ring-offset-2 dark:hover:bg-amethyste-600 
              transition-colors gap-2"
            >
              <PlusIcon className="w-4 h-4" />
              <span>Add Match</span>
            </button>
          </div>
        </div>
        
        {/* Event Meta Info */}
        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="flex items-center gap-2">
            <CalendarIcon className="w-5 h-5 text-onyx-400" />
            <Body.Text variant="sm" className="text-onyx-600 dark:text-onyx-300">
              Start: {format(new Date(event.startDate), "MMM d, yyyy")}
            </Body.Text>
          </div>
          <div className="flex items-center gap-2">
            <CalendarIcon className="w-5 h-5 text-onyx-400" />
            <Body.Text variant="sm" className="text-onyx-600 dark:text-onyx-300">
              End: {format(new Date(event.endDate), "MMM d, yyyy")}
            </Body.Text>
          </div>
          {event.metadata && (
            <div className="flex items-center gap-2">
              <UsersIcon className="w-5 h-5 text-onyx-400" />
              <Body.Text variant="sm" className="text-onyx-600 dark:text-onyx-300">
                {event.metadata.totalPlayers} Players
              </Body.Text>
            </div>
          )}
        </div>

        {/* Last Updated */}
        {event.metadata?.lastUpdated && (
          <Body.Caption className="mt-4 block">
            Last updated: {format(new Date(event.metadata.lastUpdated), "MMM d, yyyy")}
          </Body.Caption>
        )}
      </div>
    </div>
  );
}