import { Event } from "@/types/Event";
import { EventStatistics, EventStatisticsCalculator } from "@/lib/Statistics";
import { EventRanking } from "@/types/Ranking";
import { promises as fs } from 'fs';
import path from 'path';
import { Match } from "@/types/Match";
import { Player } from "@/types/Player";
import { 
  PlayerCategoryType,
  MatchStatusType,
  ValidationStatusType,
  EventTypeType,
  EventStatusType
} from "@/types/Enums";
import { ExclamationCircleIcon } from "@heroicons/react/24/outline";
import EventHeader from "@/app/components/EventHeader";
import StatsOverview from "@/app/components/StatsOverview";
import TabNav from "@/app/components/TabNav";
import PlayerRankings from "@/app/components/PlayerRankings";
import MatchHistory from "@/app/components/MatchHistory";
import EventStats from "@/app/components/EventStats";

interface MatchDisplay {
  id: string;
  eventId: string;
  date: string;
  status: MatchStatusType;
  player1Id: string;
  player2Id: string;
  player1Details: {
    name: string;
    category: PlayerCategoryType;
  };
  player2Details: {
    name: string;
    category: PlayerCategoryType;
  };
  result?: {
    score: [number, number];
    pr: number;
    pdi: number;
    ds: number;
  };
}

async function getEvent(eventId: string): Promise<Event | null> {
  try {
    const filePath = path.join(process.cwd(), 'data', 'events.json');
    const fileContent = await fs.readFile(filePath, 'utf-8');
    const data = JSON.parse(fileContent);
    const rawEvent = data.find((e: any) => e.id === eventId);
    
    if (!rawEvent) return null;

    return {
      id: rawEvent.id,
      name: rawEvent.name,
      startDate: new Date(rawEvent.startDate),
      endDate: new Date(rawEvent.endDate),
      type: rawEvent.type as EventTypeType,
      status: rawEvent.status as EventStatusType,
      metadata: rawEvent.metadata
    };
  } catch (error) {
    console.error('Failed to fetch event:', error);
    return null;
  }
}

async function getPlayers(): Promise<Player[]> {
  try {
    const filePath = path.join(process.cwd(), 'data', 'players.json');
    const fileContent = await fs.readFile(filePath, 'utf-8');
    const data = JSON.parse(fileContent);
    return data.players || [];
  } catch (error) {
    console.error('Failed to fetch players:', error);
    return [];
  }
}

async function getRankings(eventId: string): Promise<EventRanking | null> {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || '';
    await fetch(`${baseUrl}/api/rankings/${eventId}`, {
      method: 'POST',
      cache: 'no-store'
    });

    const response = await fetch(
      `${baseUrl}/api/rankings/${eventId}`,
      { cache: 'no-store' }
    );

    if (!response.ok) {
      throw new Error('Failed to fetch rankings');
    }

    const rankingData = await response.json();
    return rankingData;
  } catch (error) {
    console.error('Failed to fetch rankings:', error);
    return null;
  }
}

function transformMatchForHistory(match: Match, players: Player[]): MatchDisplay {
  const player1 = players.find(p => p.id === match.player1.id);
  const player2 = players.find(p => p.id === match.player2.id);

  return {
    id: match.id,
    eventId: match.eventId,
    date: match.date,
    status: match.status,
    player1Id: match.player1.id,
    player2Id: match.player2.id,
    player1Details: {
      name: player1?.name || 'Unknown Player',
      category: match.player1.categoryBefore
    },
    player2Details: {
      name: player2?.name || 'Unknown Player',
      category: match.player2.categoryBefore
    },
    result: match.result ? {
      score: match.result.score,
      pr: match.result.pr,
      pdi: match.result.pdi,
      ds: match.result.ds
    } : undefined
  };
}

async function getMatches(eventId: string, players: Player[]): Promise<Match[]> {
  try {
    const filePath = path.join(process.cwd(), 'data', 'matches', `${eventId}.json`);
    const fileContent = await fs.readFile(filePath, 'utf-8');
    const { matches } = JSON.parse(fileContent);
    
    return matches.map((match: any) => ({
      id: match.id,
      eventId: match.eventId,
      date: match.date,
      player1: {
        id: match.player1.id,
        ratingBefore: match.player1.ratingBefore,
        ratingAfter: match.player1.ratingAfter,
        categoryBefore: match.player1.categoryBefore as PlayerCategoryType,
        categoryAfter: match.player1.categoryAfter as PlayerCategoryType
      },
      player2: {
        id: match.player2.id,
        ratingBefore: match.player2.ratingBefore,
        ratingAfter: match.player2.ratingAfter,
        categoryBefore: match.player2.categoryBefore as PlayerCategoryType,
        categoryAfter: match.player2.categoryAfter as PlayerCategoryType
      },
      status: match.status as MatchStatusType,
      result: match.result ? {
        score: match.result.score,
        pr: match.result.pr,
        pdi: match.result.pdi,
        ds: match.result.ds,
        validation: {
          player1Approved: match.result.validation.player1Approved,
          player2Approved: match.result.validation.player2Approved,
          timestamp: match.result.validation.timestamp,
          status: match.result.validation.status as ValidationStatusType
        }
      } : undefined,
      metadata: match.metadata
    }));
  } catch (error) {
    console.error('Failed to fetch matches:', error);
    return [];
  }
}

export default async function EventPage({ params }: { params: { eventId: string } }) {
  const eventId = params.eventId;

  try {
    const [eventData, players] = await Promise.all([
      getEvent(eventId),
      getPlayers()
    ]);

    if (!eventData) {
      throw new Error('Event not found');
    }

    // Get matches data
    const matches = await getMatches(eventId, players);
    const matchesForDisplay = matches.map(match => transformMatchForHistory(match, players));

    // Get rankings, with fallback to empty rankings if not available
    let eventRanking = await getRankings(eventId) || {
      eventId,
      lastUpdated: new Date().toISOString(),
      rankings: []
    };

    // Calculate statistics
    const stats = EventStatisticsCalculator.calculate(eventData, matches, players);

    return (
      <div className="min-h-screen bg-onyx-50 dark:bg-onyx-950">
        <EventHeader event={eventData} />
        
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8 space-y-6">
          {/* Stats Overview Section */}
          <div className="mb-8">
            <StatsOverview stats={stats} />
          </div>

          {/* Main Content Area */}
          <div className="bg-white shadow-sm rounded-lg dark:bg-onyx-900">
            <TabNav
              defaultTab="matches"
              tabs={[
                {
                  id: "matches",
                  label: "Matches",
                  content: matchesForDisplay.length > 0 ? (
                    <MatchHistory matches={matchesForDisplay} />
                  ) : (
                    <div className="text-center py-8 text-onyx-500 dark:text-onyx-400">
                      No matches played yet.
                    </div>
                  ),
                },
                {
                  id: "rankings",
                  label: "Rankings",
                  content: (
                    <div className="rounded-lg border border-onyx-200 dark:border-onyx-800">
                      <PlayerRankings eventRanking={eventRanking} />
                    </div>
                  ),
                },
                {
                  id: "statistics",
                  label: "Statistics",
                  content: (
                    <div className="space-y-6">
                      {/* Category Distribution */}
                      <div>
                        <h3 className="text-lg font-medium text-onyx-900 dark:text-white mb-4">
                          Player Categories
                        </h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                          {Object.entries(stats.categoryDistribution).map(([category, count]) => (
                            <div 
                              key={category}
                              className="bg-onyx-50 rounded-lg p-4 dark:bg-onyx-800/50"
                            >
                              <div className="text-sm font-medium text-onyx-600 dark:text-onyx-300">
                                {category}
                              </div>
                              <div className="mt-1 text-2xl font-semibold text-onyx-900 dark:text-white">
                                {count}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Detailed Stats */}
                      <EventStats stats={stats} />
                    </div>
                  ),
                },
              ]}
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