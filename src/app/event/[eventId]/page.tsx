import { ExclamationCircleIcon } from "@heroicons/react/24/outline";
import EventHeader from "@/app/components/EventHeader";
import StatsOverview from "@/app/components/StatsOverview";
import ClientEventTabs from "@/app/components/ClientEventTabs"; // Import the new component
import { EventRepository } from "@/api/repository/eventRepository";
import { EventStatisticsCalculator } from "@/lib/Statistics";
import { EventRanking } from "@/types/Ranking";
import { MatchDisplay } from "@/types/MatchHistory";

const eventRepository = new EventRepository();

export default async function EventPage({ 
  params,
  searchParams 
}: { 
  params: { eventId: string },
  searchParams?: { round?: string }
}) {
  const eventId = params.eventId;
  const round = searchParams?.round 
    ? parseInt(searchParams.round, 10)
    : undefined;

  try {
    // Get event data
    const event = await eventRepository.getEvent(eventId);
    if (!event || !event.metadata) {
      throw new Error('Event not found');
    }

    // Get current round data
    const currentRound = round || event.metadata.currentRound;
    const [roundMatches, players, roundRankingsResult] = await Promise.all([
      eventRepository.getRoundMatches(eventId, currentRound),
      eventRepository.getPlayers(),
      eventRepository.getRoundRankings(eventId, currentRound)
    ]);

    // Enrich matches with player details
    const enrichedMatches: MatchDisplay[] = roundMatches.map(match => {
      const player1 = players.find(p => p.id === match.player1.id);
      const player2 = players.find(p => p.id === match.player2.id);

      return {
        ...match,
        player1Details: player1 ? {
          name: player1.name,
          category: player1.category
        } : undefined,
        player2Details: player2 ? {
          name: player2.name,
          category: player2.category
        } : undefined
      };
    });

    // Create default rankings if none exist
    const roundRankings: EventRanking = roundRankingsResult || {
      eventId,
      lastUpdated: new Date().toISOString(),
      rankings: [],
      metadata: {
        round: currentRound,
        isCurrentRound: currentRound === event.metadata.currentRound,
        totalRounds: event.metadata.totalRounds
      }
    };

    // Calculate statistics
    const stats = EventStatisticsCalculator.calculate(event, roundMatches, players);

    return (
      <div className="min-h-screen bg-onyx-50 dark:bg-onyx-950">
        <EventHeader event={event} />

        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8 space-y-6">
          {/* Stats Overview Section */}
          <div className="mb-8">
            <StatsOverview stats={stats} />
          </div>

          {/* Main Content Area */}
          <div className="bg-white shadow-sm rounded-lg dark:bg-onyx-900">
            {/* Use ClientEventTabs instead of TabNav */}
            <ClientEventTabs
              event={event}
              currentRound={currentRound}
              roundMatches={enrichedMatches}
              roundRankings={roundRankings}
              stats={stats}
            />
          </div>
        </div>
      </div>
    );
  } catch (error) {
    console.error('Error loading event page:', error);
    return (
      <div className="min-h-screen bg-onyx-50 dark:bg-onyx-950">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-800 dark:bg-red-900/20">
            <div className="flex">
              <ExclamationCircleIcon className="h-5 w-5 text-red-400" />
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800 dark:text-red-200">
                  Error loading event
                </h3>
                <p className="mt-1 text-sm text-red-700 dark:text-red-300">
                  Unable to load event details. Please try again later.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
}
