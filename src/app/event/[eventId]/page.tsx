import EventHeader from "@/app/components/EventHeader";
import EventStats from "@/app/components/EventStats";
import PlayerRankings from "@/app/components/PlayerRankings";
import MatchHistory from "@/app/components/MatchHistory";
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
    const players = JSON.parse(fileContent);
    return players;
  } catch (error) {
    console.error('Failed to fetch players:', error);
    return [];
  }
}

async function getRankings(eventId: string): Promise<EventRanking | null> {
  try {
    const filePath = path.join(process.cwd(), 'data', 'rankings', `${eventId}.json`);
    const fileContent = await fs.readFile(filePath, 'utf-8');
    const rankingData = JSON.parse(fileContent);
    return rankingData;
  } catch (error) {
    console.error('Failed to fetch rankings:', error);
    return null;
  }
}

// Transform raw match data for the history component
function transformMatchForHistory(match: Match, players: Player[]) {
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
    const [eventData, players, eventRanking] = await Promise.all([
      getEvent(eventId),
      getPlayers(),
      getRankings(eventId)
    ]);

    if (!eventData) {
      throw new Error('Event not found');
    }

    if (!eventRanking) {
      throw new Error('Rankings not found');
    }

    const matches = await getMatches(eventId, players);
    const matchesForDisplay = matches.map(match => transformMatchForHistory(match, players));
    const stats = EventStatisticsCalculator.calculate(eventData, matches, players);

    return (
      <div>
        <EventHeader event={eventData} />
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="space-y-8">
            {/* Event Details */}
            <div className="bg-white shadow overflow-hidden sm:rounded-lg dark:bg-gray-800">
              <div className="px-4 py-5 sm:p-6">
                <h3 className="text-lg font-medium leading-6 text-gray-900 dark:text-white">
                  Event Details
                </h3>
                <div className="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-2">
                  <div>
                    <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Players</dt>
                    <dd className="mt-1 text-sm text-gray-900 dark:text-gray-300">{eventData.metadata?.totalPlayers || 0}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Matches</dt>
                    <dd className="mt-1 text-sm text-gray-900 dark:text-gray-300">{eventData.metadata?.totalMatches || 0}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Current Round</dt>
                    <dd className="mt-1 text-sm text-gray-900 dark:text-gray-300">{eventData.metadata?.currentRound || 1}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Last Updated</dt>
                    <dd className="mt-1 text-sm text-gray-900 dark:text-gray-300">
                      {new Date(eventData.metadata?.lastUpdated || '').toLocaleDateString()}
                    </dd>
                  </div>
                </div>
              </div>
            </div>

            {/* Stats Section */}
            <EventStats stats={stats} />

            {/* Rankings Section */}
            <div>
              <h2 className="mb-4 text-2xl font-bold text-gray-900 dark:text-white">Rankings</h2>
              <PlayerRankings eventRanking={eventRanking} />
            </div>

            {/* Match History Section */}
            <div>
              <h2 className="mb-4 text-2xl font-bold text-gray-900 dark:text-white">Match History</h2>
              {matchesForDisplay.length > 0 ? (
                <MatchHistory matches={matchesForDisplay} />
              ) : (
                <div className="text-center text-gray-500 dark:text-gray-400">No matches played yet.</div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  } catch (error) {
    console.error('Error loading event page:', error);
    return (
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="text-center text-red-500">
          Error loading event data. Please try again later.
        </div>
      </div>
    );
  }
}