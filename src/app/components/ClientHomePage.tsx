"use client";

import { Event } from "@/types/Event";
import { useState, useMemo } from "react";
import { PlusIcon, CalendarIcon } from '@heroicons/react/24/outline';
import EventCard from "./EventCard";
import { useRouter } from "next/navigation";
import { CreateEventForm } from "@/app/components/CreateEventForm";
import { EventStatus } from "@/types/Enums";

interface ClientHomePageProps {
  initialEvents: Event[];
}

export default function ClientHomePage({ initialEvents }: ClientHomePageProps) {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [filter, setFilter] = useState<'all' | 'active' | 'past'>('all');
  const router = useRouter();

  const handleCreateClick = () => {
    setShowCreateForm(true);
  };

  const filteredEvents = useMemo(() => {
    return initialEvents.filter(event => {
      switch (filter) {
        case 'active':
          return event.status === EventStatus.OPEN || event.status === EventStatus.IN_PROGRESS;
        case 'past':
          return event.status === EventStatus.CLOSED || event.status === EventStatus.CANCELLED;
        default:
          return true;
      }
    });
  }, [initialEvents, filter]);

  return (
    <div>
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold text-onyx-800 dark:text-white">
            Events
          </h1>
          <p className="mt-2 text-onyx-600 dark:text-onyx-400">
            Manage and track your scrabble tournaments
          </p>
        </div>
        <button 
          onClick={handleCreateClick}
          className="inline-flex items-center rounded-md bg-amethyste-500 px-4 py-2 text-sm font-medium text-white
            hover:bg-amethyste-600 transition-colors gap-2"
        >
          <PlusIcon className="w-5 h-5" />
          Create Event
        </button>
      </div>

      <div className="mt-8">
        {/* Filter Section */}
        <div className="mb-6 flex items-center justify-between">
          <div className="flex gap-2">
            <button 
              onClick={() => setFilter('all')}
              className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-medium 
                ${filter === 'all' 
                  ? 'bg-amethyste-100 text-amethyste-700 dark:bg-amethyste-900/30 dark:text-amethyste-200'
                  : 'text-onyx-700 hover:bg-onyx-100 dark:text-onyx-300 dark:hover:bg-onyx-800'
                } transition-colors`}
            >
              All Events
            </button>
            <button 
              onClick={() => setFilter('active')}
              className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-medium
                ${filter === 'active'
                  ? 'bg-amethyste-100 text-amethyste-700 dark:bg-amethyste-900/30 dark:text-amethyste-200'
                  : 'text-onyx-700 hover:bg-onyx-100 dark:text-onyx-300 dark:hover:bg-onyx-800'
                } transition-colors`}
            >
              Active
            </button>
            <button 
              onClick={() => setFilter('past')}
              className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-medium
                ${filter === 'past'
                  ? 'bg-amethyste-100 text-amethyste-700 dark:bg-amethyste-900/30 dark:text-amethyste-200'
                  : 'text-onyx-700 hover:bg-onyx-100 dark:text-onyx-300 dark:hover:bg-onyx-800'
                } transition-colors`}
            >
              Past
            </button>
          </div>
        </div>

        {/* Events Grid */}
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filteredEvents.map((event) => (
            <EventCard key={event.id} event={event} />
          ))}
        </div>

        {/* Empty State */}
        {filteredEvents.length === 0 && (
          <div className="text-center py-12">
            <div className="mx-auto w-24 h-24 rounded-full bg-onyx-100 flex items-center justify-center mb-4
              dark:bg-onyx-800">
              <CalendarIcon className="w-12 h-12 text-onyx-400" />
            </div>
            <h3 className="text-lg font-semibold text-onyx-800 dark:text-white">
              {filter === 'all' 
                ? 'No events found'
                : filter === 'active'
                ? 'No active events'
                : 'No past events'
              }
            </h3>
            <p className="mt-1 text-sm text-onyx-600 dark:text-onyx-400">
              {filter === 'all' && 'Get started by creating a new event.'}
            </p>
            {filter === 'all' && (
              <button 
                onClick={handleCreateClick}
                className="mt-4 inline-flex items-center rounded-md bg-amethyste-500 px-4 py-2 text-sm font-medium text-white
                  hover:bg-amethyste-600 transition-colors gap-2"
              >
                <PlusIcon className="w-5 h-5" />
                Create your first event
              </button>
            )}
          </div>
        )}
      </div>

      {/* Create Event Form Modal */}
      {showCreateForm && (
        <CreateEventForm
          isOpen={showCreateForm}
          onClose={() => setShowCreateForm(false)}
        />
      )}
    </div>
  );
}
