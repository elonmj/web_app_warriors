import { 
  ref, 
  get, 
  push, 
  query as dbQuery,
  orderByChild, 
  equalTo, 
  set, 
  update, 
  remove,
  child
} from 'firebase/database';
import { FirebaseBaseRepository } from './FirebaseBaseRepository';
import { Event } from '@/types/Event';
import { Match } from '@/types/Match';
import { EventRanking } from '@/types/Ranking';
import { MatchStatusType, PlayerCategoryType } from '@/types/Enums';

export class FirebaseEventRepository extends FirebaseBaseRepository {
  /**
   * Get all events
   */
  async getAllEvents(): Promise<Event[]> {
    try {
      const data = await this.getData<Record<string, Event>>('events');
      return this.objectToArray<Event>(data);
    } catch (error) {
      console.error('Error getting all events:', error);
      throw error;
    }
  }

  /**
   * Get event by ID
   */
  async getEvent(id: string): Promise<Event | null> {
    try {
      return await this.getData<Event>(`events/${id}`);
    } catch (error) {
      console.error(`Error getting event ${id}:`, error);
      throw error;
    }
  }

  /**
   * Create new event
   */
  async createEvent(event: Omit<Event, 'id'>): Promise<Event> {
    try {
      const newEventId = await this.pushData('events', event);
      const createdEvent = { ...event, id: newEventId };
      return createdEvent;
    } catch (error) {
      console.error('Error creating event:', error);
      throw error;
    }
  }

  /**
   * Update event
   */
  async updateEvent(id: string, updates: Partial<Event>): Promise<Event> {
    try {
      await this.updateData(`events/${id}`, updates);
      const updatedEvent = await this.getEvent(id);
      if (!updatedEvent) {
        throw new Error(`Event ${id} not found after update`);
      }
      return updatedEvent;
    } catch (error) {
      console.error(`Error updating event ${id}:`, error);
      throw error;
    }
  }

  /**
   * Delete event and all related data
   */
  async deleteEvent(eventId: string): Promise<void> {
    try {
      // Delete the event, its matches and rankings - in Realtime DB, 
      // we can just remove the parent node
      await this.deleteData(`events/${eventId}`);
      // Also delete matches and rankings
      await this.deleteData(`matches/${eventId}`);
      await this.deleteData(`rankings/${eventId}`);
      
      console.log(`Event ${eventId} successfully deleted`);
    } catch (error) {
      console.error('Error deleting event:', error);
      throw error;
    }
  }

  /**
   * Get matches for a specific round
   */
  async getRoundMatches(eventId: string, round: number): Promise<Match[]> {
    try {
      // In Realtime Database, use query with orderByChild and equalTo
      const matchesRef = dbQuery(
        ref(this.db, `matches/${eventId}`),
        orderByChild('metadata/round'),
        equalTo(round)
      );
      
      const snapshot = await get(matchesRef);
      if (!snapshot.exists()) {
        return [];
      }

      const matchesData = snapshot.val();
      
      // Transform data to proper Match objects with all required fields
      const matches: Match[] = Object.entries(matchesData).map(([id, data]: [string, any]) => {
        return {
          id,
          eventId,
          date: data.date || new Date().toISOString(),
          player1: {
            id: data.player1?.id || '',
            ratingBefore: data.player1?.ratingBefore || 1000,
            ratingAfter: data.player1?.ratingAfter || 1000,
            categoryBefore: data.player1?.categoryBefore || 'ONYX',
            categoryAfter: data.player1?.categoryAfter || 'ONYX',
            name: data.player1?.name
          },
          player2: {
            id: data.player2?.id || '',
            ratingBefore: data.player2?.ratingBefore || 1000,
            ratingAfter: data.player2?.ratingAfter || 1000,
            categoryBefore: data.player2?.categoryBefore || 'ONYX',
            categoryAfter: data.player2?.categoryAfter || 'ONYX',
            name: data.player2?.name
          },
          status: data.status || 'pending',
          result: data.result,
          metadata: {
            round: data.metadata?.round || round,
            isRandom: data.metadata?.isRandom || false,
            createdAt: data.metadata?.createdAt || new Date().toISOString(),
            updatedAt: data.metadata?.updatedAt || new Date().toISOString()
          }
        };
      });

      return matches;
    } catch (error) {
      console.error(`Error getting round ${round} matches for event ${eventId}:`, error);
      throw error;
    }
  }

  /**
   * Get all matches for an event
   */
  async getEventMatches(eventId: string): Promise<Match[]> {
    try {
      const data = await this.getData<Record<string, any>>(`matches/${eventId}`);
      if (!data) return [];
      
      // Transform data to proper Match objects
      const matches: Match[] = Object.entries(data).map(([id, matchData]) => {
        return {
          id,
          eventId,
          date: matchData.date || new Date().toISOString(),
          player1: {
            id: matchData.player1?.id || '',
            ratingBefore: matchData.player1?.ratingBefore || 1000,
            ratingAfter: matchData.player1?.ratingAfter || 1000,
            categoryBefore: matchData.player1?.categoryBefore || 'ONYX',
            categoryAfter: matchData.player1?.categoryAfter || 'ONYX',
            name: matchData.player1?.name
          },
          player2: {
            id: matchData.player2?.id || '',
            ratingBefore: matchData.player2?.ratingBefore || 1000,
            ratingAfter: matchData.player2?.ratingAfter || 1000,
            categoryBefore: matchData.player2?.categoryBefore || 'ONYX',
            categoryAfter: matchData.player2?.categoryAfter || 'ONYX',
            name: matchData.player2?.name
          },
          status: matchData.status || 'pending',
          result: matchData.result,
          metadata: {
            round: matchData.metadata?.round || 1,
            isRandom: matchData.metadata?.isRandom || false,
            createdAt: matchData.metadata?.createdAt || new Date().toISOString(),
            updatedAt: matchData.metadata?.updatedAt || new Date().toISOString()
          }
        };
      });
      
      return matches;
    } catch (error) {
      console.error(`Error getting matches for event ${eventId}:`, error);
      return []; // Return empty array on error to be more resilient
    }
  }

  /**
   * Get players
   */
  async getPlayers(): Promise<any[]> {
    try {
      const data = await this.getData<Record<string, any>>('players');
      return this.objectToArray<any>(data);
    } catch (error) {
      console.error('Error getting players:', error);
      return []; // Return empty array on error to be more resilient
    }
  }

  /**
   * Add match to an event
   */
  async addEventMatch(eventId: string, match: Match): Promise<Match> {
    try {
      // If match has an ID, use it, otherwise generate one
      if (match.id) {
        await this.setData(`matches/${eventId}/${match.id}`, match);
        return match;
      } else {
        const matchId = await this.pushData(`matches/${eventId}`, match);
        return { ...match, id: matchId };
      }
    } catch (error) {
      console.error(`Error adding match to event ${eventId}:`, error);
      throw error;
    }
  }

  /**
   * Update match in an event
   */
  async updateEventMatch(eventId: string, matchId: string, updates: Partial<Match>): Promise<Match> {
    try {
      await this.updateData(`matches/${eventId}/${matchId}`, updates);
      
      // Get updated match
      const updatedMatch = await this.getData<Match>(`matches/${eventId}/${matchId}`);
      if (!updatedMatch) {
        throw new Error(`Match ${matchId} not found after update`);
      }
      
      return updatedMatch;
    } catch (error) {
      console.error(`Error updating match ${matchId} in event ${eventId}:`, error);
      throw error;
    }
  }

  /**
   * Get rankings for a specific round
   */
  async getRoundRankings(eventId: string, round: number): Promise<EventRanking | null> {
    try {
      return await this.getData<EventRanking>(`rankings/${eventId}/round${round}`);
    } catch (error) {
      console.error(`Error getting round ${round} rankings for event ${eventId}:`, error);
      return null;
    }
  }

  /**
   * Save rankings for a specific round
   */
  async saveRoundRankings(eventId: string, round: number, rankings: EventRanking): Promise<void> {
    try {
      await this.setData(`rankings/${eventId}/round${round}`, rankings);
    } catch (error) {
      console.error(`Error saving round ${round} rankings for event ${eventId}:`, error);
      throw error;
    }
  }
}
