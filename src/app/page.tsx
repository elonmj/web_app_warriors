import EventCard from "./components/EventCard";
import type { Event } from "@/types/Event";
import { promises as fs } from 'fs';
import path from 'path';
import { EventTypeType, EventStatusType } from "@/types/Enums";

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
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Events
          </h1>
          <button className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2">
            Create Event
          </button>
        </div>

        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {events.map((event) => (
            <EventCard key={event.id} event={event} />
          ))}
        </div>

        {events.length === 0 && (
          <div className="mt-8 text-center text-gray-500 dark:text-gray-400">
            No events found. Create one to get started.
          </div>
        )}
      </div>
    );
  } catch (error) {
    console.error('Error loading events:', error);
    return (
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="text-center text-red-500">
          Error loading events. Please try again later.
        </div>
      </div>
    );
  }
}
