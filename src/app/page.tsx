import EventCard from "./components/EventCard";
import type { Event } from "@/lib/Event";

// Mock data for development - will be replaced with actual API calls
const mockEvents: Event[] = [
  {
    id: 1,
    name: "Winter Tournament 2025",
    startDate: new Date("2025-01-01"),
    endDate: new Date("2025-03-31"),
    isOpen: true,
  },
  {
    id: 2,
    name: "Spring Championship",
    startDate: new Date("2025-04-01"),
    endDate: new Date("2025-06-30"),
    isOpen: false,
  },
];

export default function Home() {
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
        {mockEvents.map((event) => (
          <EventCard key={event.id} event={event} />
        ))}
      </div>

      {mockEvents.length === 0 && (
        <div className="mt-8 text-center text-gray-500 dark:text-gray-400">
          No events found. Create one to get started.
        </div>
      )}
    </div>
  );
}
