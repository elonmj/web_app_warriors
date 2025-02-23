import { BaseRepository } from './BaseRepository';
import { Event, CreateEventInput, UpdateEventInput } from '../../types/Event';
import { Match } from '../../types/Match';
import { EventRanking } from '../../types/Ranking';
import { Player } from '../../types/Player';
import { EventStatus } from '../../types/Enums';
import path from 'path';

export class EventRepository extends BaseRepository {
  private readonly EVENTS_FILE = 'events.json';
  private readonly PLAYERS_FILE = 'players.json';

  private getRoundMatchesPath(eventId: string, round: number): string {
    return path.join('matches', eventId, `${round}.json`);
  }

  private getRoundRankingsPath(eventId: string, round: number): string {
    return path.join('rankings', eventId, `${round}.json`);
  }

  async getPlayers(): Promise<Player[]> {
    try {
      const data = await this.readJsonFile<{ players: Player[] }>(this.PLAYERS_FILE);
      return data.players || [];
    } catch (error) {
      if ((error as Error).message.includes('not found')) {
        await this.writeJsonFile(this.PLAYERS_FILE, { players: [] });
        return [];
      }
      throw error;
    }
  }

  async getAllEvents(): Promise<Event[]> {
    try {
      const data = await this.readJsonFile<{ events: Event[] }>(this.EVENTS_FILE);
      return data.events;
    } catch (error) {
      if ((error as Error).message.includes('not found')) {
        await this.writeJsonFile(this.EVENTS_FILE, { events: [] });
        return [];
      }
      throw error;
    }
  }

  async getEvent(id: string): Promise<Event | null> {
    const events = await this.getAllEvents();
    return events.find(event => event.id === id) || null;
  }

  async createEvent(input: CreateEventInput): Promise<Event> {
    return await this.withLock('events', async () => {
      const events = await this.getAllEvents();

      const newEvent: Event = {
        id: `event-${Date.now()}`,
        name: input.name,
        startDate: input.startDate,
        endDate: input.endDate,
        type: input.type,
        status: EventStatus.OPEN,
        metadata: {
          totalPlayers: 0,
          totalMatches: 0,
          currentRound: 0,
          totalRounds: 0,
          lastUpdated: new Date().toISOString(),
          roundHistory: {},
          byeHistory: []
        }
      };

      events.push(newEvent);
      await this.writeJsonFile(this.EVENTS_FILE, { events });

      // Create initial files
      await this.writeJsonFile(`matches/${newEvent.id}/info.json`, {
        eventId: newEvent.id,
        created: new Date().toISOString()
      });

      await this.writeJsonFile(`rankings/${newEvent.id}/info.json`, {
        eventId: newEvent.id,
        created: new Date().toISOString()
      });

      return newEvent;
    });
  }


  async updateEvent(id: string, input: UpdateEventInput): Promise<Event> {
    return await this.withLock('events', async () => {
      const events = await this.getAllEvents();
      const eventIndex = events.findIndex(e => e.id === id);

      if (eventIndex === -1) {
        throw new Error(`Event not found: ${id}`);
      }

      const currentEvent = events[eventIndex];

      // Ensure metadata exists and all required fields are preserved
      const currentMetadata = currentEvent.metadata || {
        totalPlayers: 0,
        totalMatches: 0,
        currentRound: 0,
        totalRounds: 0,
        lastUpdated: new Date().toISOString(),
        roundHistory: {},
        byeHistory: []
      };

      const updatedMetadata = {
        ...currentMetadata,
        ...(input.metadata || {}),
        lastUpdated: new Date().toISOString()
      };

      const updatedEvent: Event = {
        ...currentEvent,
        ...(input.name && { name: input.name }),
        ...(input.startDate && { startDate: input.startDate }),
        ...(input.endDate && { endDate: input.endDate }),
        ...(input.type && { type: input.type }),
        ...(input.status && { status: input.status }),
        metadata: updatedMetadata
      };

      events[eventIndex] = updatedEvent;
      await this.writeJsonFile(this.EVENTS_FILE, { events });

      return updatedEvent;
    });
  }

  async getEventMatches(eventId: string): Promise<Match[]> {
    try {
      // First try round-based structure
      const event = await this.getEvent(eventId);
      if (!event) throw new Error(`Event not found: ${eventId}`);

      const rounds = Array.from(
        { length: event.metadata?.totalRounds || 0 },
        (_, i) => i + 1
      );

      const allMatches: Match[] = [];
      for (const round of rounds) {
        try {
          const roundMatches = await this.getRoundMatches(eventId, round);
          allMatches.push(...roundMatches);
        } catch (error) {
          // Skip if round file doesn't exist
          if (!(error as Error).message.includes('not found')) {
            throw error;
          }
        }
      }

      return allMatches;
    } catch (error) {
      if ((error as Error).message.includes('not found')) {
        return [];
      }
      throw error;
    }
  }

  async getRoundMatches(eventId: string, round: number): Promise<Match[]> {
    try {
      const filePath = this.getRoundMatchesPath(eventId, round);
      const data = await this.readJsonFile<{ matches: Match[] }>(filePath);
      return data.matches;
    } catch (error) {
      if ((error as Error).message.includes('not found')) {
        return [];
      }
      throw error;
    }
  }

  async addEventMatch(eventId: string, match: Match): Promise<void> {
    const round = match.metadata.round;
    if (!round) {
      throw new Error('Match must have a round number');
    }

    return await this.withLock(`matches-${eventId}-${round}`, async () => {
      const roundMatches = await this.getRoundMatches(eventId, round);
      roundMatches.push(match);

      const filePath = this.getRoundMatchesPath(eventId, round);
      await this.writeJsonFile(filePath, {
        eventId,
        round,
        matches: roundMatches
      });

      // Update event metadata
      const event = await this.getEvent(eventId);
      if (event && event.metadata) {
        const allMatches = await this.getEventMatches(eventId);
        const metadata = {
          ...event.metadata,
          totalMatches: allMatches.length
        };
        await this.updateEvent(eventId, { id: eventId, metadata });
      }
    });
  }

  async updateEventMatch(eventId: string, matchId: string, updates: Partial<Match>): Promise<Match> {
    const event = await this.getEvent(eventId);
    if (!event || !event.metadata) throw new Error(`Event not found: ${eventId}`);

    // Find the match in the current round first
    const currentRound = event.metadata.currentRound;
    if (!currentRound) throw new Error('Event has no current round');

    return await this.withLock(`matches-${eventId}-${currentRound}`, async () => {
      const roundMatches = await this.getRoundMatches(eventId, currentRound);
      const matchIndex = roundMatches.findIndex(m => m.id === matchId);

      if (matchIndex === -1) {
        throw new Error(`Match not found: ${matchId}`);
      }

      const updatedMatch = {
        ...roundMatches[matchIndex],
        ...updates
      };

      roundMatches[matchIndex] = updatedMatch;

      const filePath = this.getRoundMatchesPath(eventId, currentRound);
      await this.writeJsonFile(filePath, {
        eventId,
        round: currentRound,
        matches: roundMatches
      });

      return updatedMatch;
    });
  }

  async getRoundRankings(eventId: string, round: number): Promise<EventRanking | null> {
    try {
      const filePath = this.getRoundRankingsPath(eventId, round);
      return await this.readJsonFile<EventRanking>(filePath);
    } catch (error) {
      if ((error as Error).message.includes('not found')) {
        return null;
      }
      throw error;
    }
  }

  async saveRoundRankings(eventId: string, round: number, rankings: EventRanking): Promise<void> {
    const filePath = this.getRoundRankingsPath(eventId, round);
    await this.writeJsonFile(filePath, {
      ...rankings,
      lastUpdated: new Date().toISOString()
    });
  }
  async deleteRoundData(eventId: string, round: number): Promise<void> {
    const matchesFilePath = this.getRoundMatchesPath(eventId, round);
    const rankingsFilePath = this.getRoundRankingsPath(eventId, round);

    await this.deleteFile(matchesFilePath);
    await this.deleteFile(rankingsFilePath);
  }


}