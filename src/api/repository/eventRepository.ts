import { BaseRepository } from './BaseRepository';
import { Event, CreateEventInput, UpdateEventInput } from '../../types/Event';
import { Match } from '../../types/Match';
import { RankingSnapshot } from '../../types/Ranking';

export class EventRepository extends BaseRepository {
  private readonly EVENTS_FILE = 'events.json';

  async getAllEvents(): Promise<Event[]> {
    try {
      const data = await this.readJsonFile<{ events: Event[] }>(this.EVENTS_FILE);
      return data.events;
    } catch (error) {
      if ((error as Error).message.includes('not found')) {
        // Initialize empty events file if it doesn't exist
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
        status: 'draft',
        metadata: {
          totalPlayers: 0,
          totalMatches: 0,
          currentRound: 0,
          lastUpdated: new Date().toISOString()
        }
      };

      events.push(newEvent);
      await this.writeJsonFile(this.EVENTS_FILE, { events });

      // Create empty matches and rankings files for this event
      await this.writeJsonFile(`matches/${newEvent.id}.json`, {
        eventId: newEvent.id,
        matches: []
      });
      
      await this.writeJsonFile(`rankings/${newEvent.id}.json`, {
        eventId: newEvent.id,
        lastUpdated: new Date().toISOString(),
        rankings: []
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

      const updatedEvent = {
        ...events[eventIndex],
        ...input,
        metadata: {
          ...events[eventIndex].metadata,
          ...input.metadata,
          lastUpdated: new Date().toISOString()
        }
      };

      events[eventIndex] = updatedEvent;
      await this.writeJsonFile(this.EVENTS_FILE, { events });

      return updatedEvent;
    });
  }

  async getEventMatches(eventId: string): Promise<Match[]> {
    try {
      const data = await this.readJsonFile<{ matches: Match[] }>(`matches/${eventId}.json`);
      return data.matches;
    } catch (error) {
      if ((error as Error).message.includes('not found')) {
        return [];
      }
      throw error;
    }
  }

  async addEventMatch(eventId: string, match: Match): Promise<void> {
    return await this.withLock(`matches-${eventId}`, async () => {
      const matches = await this.getEventMatches(eventId);
      matches.push(match);
      
      await this.writeJsonFile(`matches/${eventId}.json`, {
        eventId,
        matches
      });

      // Update event metadata
      const event = await this.getEvent(eventId);
      if (event) {
        await this.updateEvent(eventId, {
          id: eventId,
          metadata: {
            ...event.metadata,
            totalMatches: matches.length
          }
        });
      }
    });
  }

  async saveRankingSnapshot(eventId: string, snapshot: RankingSnapshot): Promise<void> {
    const filename = `rankings/snapshots/${eventId}/${Date.now()}.json`;
    await this.writeJsonFile(filename, snapshot);
  }

  async getEventRankingSnapshots(eventId: string): Promise<RankingSnapshot[]> {
    try {
      const files = await this.listFiles(`rankings/snapshots/${eventId}`);
      const snapshots = await Promise.all(
        files.map(file => 
          this.readJsonFile<RankingSnapshot>(`rankings/snapshots/${eventId}/${file}`)
        )
      );
      return snapshots.sort((a, b) => 
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      );
    } catch {
      return [];
    }
  }
}