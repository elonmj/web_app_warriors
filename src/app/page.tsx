import { Suspense } from "react";
import { FirebaseEventRepository } from "@/api/repository/FirebaseEventRepository";
import { Heading } from "@/components/ui/Typography";
import  EventCard  from "./components/EventCard";
import {RoundLoadingSkeleton} from "./components/RoundLoadingSkeleton";

const eventRepository = new FirebaseEventRepository();

export default async function Home() {
  const events = await eventRepository.getAllEvents();

  // Filter active and upcoming events
  const activeEvents = events.filter(event => event.status === "in_progress" || event.status === "open"); 
  // Sort by start date (most recent first)
  activeEvents.sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime());

  return (
    <main className="min-h-screen p-8">
      <header className="mb-8">
        <Heading.H1 className="text-center">Scrabble League Manager</Heading.H1>
        <Heading.H2 className="text-center mt-2 text-onyx-600 dark:text-onyx-400">
          Manage your tournaments, track player progress and rankings
        </Heading.H2>
      </header>

      <section className="mx-auto max-w-6xl">
        <Heading.H3 className="mb-6">Active Events</Heading.H3>
        
        <Suspense fallback={<RoundLoadingSkeleton />}>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {activeEvents.length > 0 ? (
              activeEvents.map(event => (
                <EventCard key={event.id} event={event} />
              ))
            ) : (
              <p className="col-span-full text-center text-onyx-500 dark:text-onyx-400 py-12">
                No active events. Check back later or create a new event.
              </p>
            )}
          </div>
        </Suspense>
      </section>
    </main>
  );
}
