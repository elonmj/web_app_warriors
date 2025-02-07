import EventHeader from "@/app/components/EventHeader";
import EventStats from "@/app/components/EventStats";
import PlayerRankings from "@/app/components/PlayerRankings";
import { Event } from "@/lib/Event";
import { EventStatistics } from "@/lib/Statistics";
import { Classification } from "@/lib/Classification";

// Mock data for development - will be replaced with actual API calls
const mockEvent: Event = {
  id: 1,
  name: "Winter Tournament 2025",
  startDate: new Date("2025-01-01"),
  endDate: new Date("2025-03-31"),
  isOpen: false,
};

const mockStats: EventStatistics = {
  eventId: "1",
  totalMatches: 45,
  completedMatches: 42,
  activePlayers: 16,
  matchesPerCategory: {
    ONYX: 15,
    AMÉTHYSTE: 12,
    TOPAZE: 10,
    DIAMANT: 8,
  },
  categoryDistribution: {
    ONYX: 6,
    AMÉTHYSTE: 4,
    TOPAZE: 4,
    DIAMANT: 2,
  },
  averageRating: 1450,
  averageDS: 65.5,
};

const mockClassification: Classification = {
  eventId: 1,
  lastUpdated: new Date(),
  rankings: [
    {
      playerId: 1,
      playerName: "John Doe",
      category: "DIAMANT",
      rank: 1,
      points: 42,
      matchesPlayed: 15,
    },
    {
      playerId: 2,
      playerName: "Jane Smith",
      category: "TOPAZE",
      rank: 2,
      points: 38,
      matchesPlayed: 14,
    },
    {
      playerId: 3,
      playerName: "Bob Johnson",
      category: "AMÉTHYSTE",
      rank: 3,
      points: 35,
      matchesPlayed: 13,
    },
    // Add more mock players as needed
  ],
};

export default function EventPage({ params }: { params: { eventId: string } }) {
  return (
    <div>
      <EventHeader event={mockEvent} />
      
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="space-y-8">
          {/* Stats Section */}
          <EventStats stats={mockStats} />

          {/* Match History Section */}
          <div className="mt-8">
            <h2 className="mb-4 text-2xl font-bold text-gray-900 dark:text-white">
              Rankings
            </h2>
            <PlayerRankings rankings={mockClassification.rankings} />
          </div>
        </div>
      </div>
    </div>
  );
}