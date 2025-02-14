import EventCard from "./components/EventCard";
import type { Event } from "@/types/Event";
import { promises as fs } from 'fs';
import path from 'path';
import { EventTypeType, EventStatusType } from "@/types/Enums";
import { PlusIcon, CalendarIcon, ExclamationCircleIcon } from '@heroicons/react/24/outline';

interface RawEvent {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  type: string;
  status: string;
  metadata?: {
    totalPlayers: number;
    totalMatches: number;
    currentRound: number;
    lastUpdated: string;
  };
}

async function getEvents(): Promise<Event[]> {
  try {
    const filePath = path.join(process.cwd(), 'data', 'events.json');
    const fileContent = await fs.readFile(filePath, 'utf-8');
    const events = JSON.parse(fileContent);
    
    if (!Array.isArray(events)) {
      throw new Error('Invalid data structure in events.json');
    }

    return events.map((event: RawEvent) => ({
      id: event.id,
      name: event.name,
      startDate: new Date(event.startDate),
      endDate: new Date(event.endDate),
      type: event.type as EventTypeType,
      status: event.status as EventStatusType,
      metadata: event.metadata
    }));
  } catch (error) {
    console.error('Error reading events:', error);
    return [];
  }
}

export default async function Home() {
  try {
    const events = await getEvents();

    return (
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-amethyste-500 to-amethyste-600 bg-clip-text text-transparent">
              Events
            </h1>
            <p className="mt-1 text-sm text-onyx-600 dark:text-onyx-400">
              Manage and track your scrabble tournaments
            </p>
          </div>
          <button className="inline-flex items-center rounded-md bg-amethyste-500 px-4 py-2.5 text-sm font-semibold text-white
            shadow-sm hover:bg-amethyste-600 gap-2 group transition-all duration-200
            focus:outline-none focus:ring-2 focus:ring-amethyste-500 focus:ring-offset-2">
            <PlusIcon className="w-5 h-5 group-hover:scale-110 transition-transform" />
            Create Event
          </button>
        </div>

        <div className="mt-8">
          {/* Filter Section */}
          <div className="mb-6 flex items-center justify-between">
            <div className="flex gap-2">
              <button className="inline-flex items-center rounded-full px-3 py-1 text-sm font-medium text-onyx-700 hover:bg-onyx-100
                dark:text-onyx-300 dark:hover:bg-onyx-800 transition-colors">
                All Events
              </button>
              <button className="inline-flex items-center rounded-full px-3 py-1 text-sm font-medium text-onyx-700 hover:bg-onyx-100
                dark:text-onyx-300 dark:hover:bg-onyx-800 transition-colors">
                Active
              </button>
              <button className="inline-flex items-center rounded-full px-3 py-1 text-sm font-medium text-onyx-700 hover:bg-onyx-100
                dark:text-onyx-300 dark:hover:bg-onyx-800 transition-colors">
                Past
              </button>
            </div>
          </div>

          {/* Events Grid */}
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {events.map((event) => (
              <EventCard key={event.id} event={event} />
            ))}
          </div>

          {/* Empty State */}
          {events.length === 0 && (
            <div className="text-center py-12">
              <div className="mx-auto w-24 h-24 rounded-full bg-onyx-100 flex items-center justify-center mb-4
                dark:bg-onyx-800">
                <CalendarIcon className="w-12 h-12 text-onyx-400" />
              </div>
              <h3 className="text-lg font-semibold text-onyx-800 dark:text-white">
                No events found
              </h3>
              <p className="mt-1 text-sm text-onyx-600 dark:text-onyx-400">
                Get started by creating a new event.
              </p>
              <button className="mt-4 inline-flex items-center rounded-md bg-amethyste-500 px-4 py-2 text-sm font-medium text-white
                hover:bg-amethyste-600 transition-colors gap-2">
                <PlusIcon className="w-5 h-5" />
                Create your first event
              </button>
            </div>
          )}
        </div>
      </div>
    );
  } catch (error) {
    console.error('Error loading events:', error);
    return (
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="rounded-lg border border-red-200 bg-red-50 p-4">
          <div className="flex">
            <ExclamationCircleIcon className="h-5 w-5 text-red-400" aria-hidden="true" />
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Error loading events</h3>
              <p className="mt-1 text-sm text-red-700">
                Please try refreshing the page or contact support if the problem persists.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }
}
