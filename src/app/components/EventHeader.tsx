import { Event } from "@/lib/Event";
import { format } from "date-fns";

interface EventHeaderProps {
  event: Event;
}

export default function EventHeader({ event }: EventHeaderProps) {
  return (
    <div className="bg-white shadow dark:bg-gray-800">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              {event.name}
            </h1>
            <div className="mt-1 text-sm text-gray-600 dark:text-gray-400">
              {format(new Date(event.startDate), "MMM d, yyyy")} -{" "}
              {format(new Date(event.endDate), "MMM d, yyyy")}
            </div>
          </div>
          <span
            className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-medium
              ${
                event.isOpen
                  ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
                  : "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300"
              }`}
          >
            {event.isOpen ? "Open" : "Closed"}
          </span>
        </div>
      </div>
    </div>
  );
}