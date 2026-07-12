import { FirebaseBaseRepository } from './FirebaseBaseRepository';
import { Event } from '@/types/Event';
import { Match } from '@/types/Match';
import { EventRanking } from '@/types/Ranking';
import { MatchStatusType, PlayerCategoryType, EventStatus, EventStatusType } from '@/types/Enums';


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
      // Fetch raw data, assuming dates are stored as ISO strings
      const rawData = await this.getData<any>(`events/${id}`);
      if (!rawData) {
        return null;
      }

      // Convert date strings to Date objects
      const eventData: Event = {
        ...rawData,
        id: id, // Ensure the ID is included if not part of rawData
        startDate: rawData.startDate ? new Date(rawData.startDate) : new Date(), // Provide default or handle error
        endDate: rawData.endDate ? new Date(rawData.endDate) : new Date(), // Provide default or handle error
      };

      return eventData;
    } catch (error) {
      console.error(`Error getting event ${id}:`, error);
      throw error;
    }
  }

  /**
   * Create new event
   */
  async createEvent(eventData: Omit<Event, 'id'>): Promise<Event> {
    try {
      // Determine initial status based on start date
      const today = new Date();
      today.setHours(0, 0, 0, 0); // Normalize today's date
      const startDate = new Date(eventData.startDate);
      startDate.setHours(0, 0, 0, 0); // Normalize start date

      let initialStatus: EventStatusType = EventStatus.OPEN; // Default to OPEN if future or past
      if (startDate < today) {
        // Log warning for past dates but still set as OPEN
        console.warn(`Event "${eventData.name}" created with a past start date.`);
      }
      // No need for specific check for today, OPEN covers it.
      // If a specific 'scheduled' or 'incoming' status existed, we'd check:
      // else if (startDate > today) { initialStatus = EventStatus.SCHEDULED; }

      const eventToSave = {
        ...eventData,
        status: initialStatus, // Set the calculated status
        playerIds: [], // Initialize empty participants list
        metadata: { // Initialize metadata
          currentRound: 0,
          totalPlayers: 0,
          totalMatches: 0,
          totalRounds: 0, // Or determine based on event type later
          lastUpdated: new Date().toISOString(),
          roundHistory: {},
          byeHistory: []
        }
      };

      const newEventId = await this.pushData('events', eventToSave);
      const createdEvent = { ...eventToSave, id: newEventId };
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
      const data = await this.getData<Record<string, any>>(`matches/${eventId}`);
      if (!data) return [];

      const filtered = Object.entries(data).filter(([_, matchData]) => {
        return matchData.metadata?.round === round;
      });

      // Transform data to proper Match objects with all required fields
      const matches: Match[] = filtered.map(([id, data]: [string, any]) => {
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

  /**
   * Add a participant to an event
   */
  async addParticipant(eventId: string, playerId: string): Promise<Event> {
    try {
      // Get current event
      const event = await this.getEvent(eventId);
      if (!event) {
        throw new Error(`Event ${eventId} not found`);
      }

      // Update playerIds array
      const currentPlayerIds = event.playerIds || [];
      if (currentPlayerIds.includes(playerId)) {
        return event; // Player already added
      }

      // Ensure metadata exists and has required fields before updating
      const currentMetadata = event.metadata || {
        totalPlayers: 0,
        totalMatches: 0,
        currentRound: 0,
        totalRounds: 0,
        lastUpdated: new Date().toISOString(),
        roundHistory: {},
        byeHistory: [],
      };

      const updates = {
        playerIds: [...currentPlayerIds, playerId],
        metadata: {
          ...currentMetadata, // Spread potentially defaulted metadata
          totalPlayers: currentMetadata.totalPlayers + 1, // Increment based on currentMetadata
          lastUpdated: new Date().toISOString() // Always update lastUpdated timestamp
        }
      };

      // Use existing updateEvent method
      return await this.updateEvent(eventId, updates as Partial<Event>); // Assert type if needed, though defaults should satisfy
    } catch (error) {
      console.error(`Error adding participant ${playerId} to event ${eventId}:`, error);
      throw error;
    }
  }

  /**
   * Remove a participant from an event
   */
  async removeParticipant(eventId: string, playerId: string): Promise<Event> {
    try {
      // Get current event
      const event = await this.getEvent(eventId);
      if (!event) {
        throw new Error(`Event ${eventId} not found`);
      }

      // Update playerIds array
      const currentPlayerIds = event.playerIds || [];
      if (!currentPlayerIds.includes(playerId)) {
        return event; // Player not in event
      }

      // Prepare updates for specific paths
      const updates: { [key: string]: any } = {};
      updates[`playerIds`] = currentPlayerIds.filter(id => id !== playerId);
      updates[`metadata/totalPlayers`] = Math.max(0, (event.metadata?.totalPlayers || 1) - 1);
      updates[`metadata/lastUpdated`] = new Date().toISOString();

      // Use the base updateData method for multi-path updates
      await this.updateData(`events/${eventId}`, updates);
      const updatedEvent = await this.getEvent(eventId);
       if (!updatedEvent) {
         throw new Error(`Event ${eventId} not found after removing participant`);
       }
      return updatedEvent;
    } catch (error) {
      console.error(`Error removing participant ${playerId} from event ${eventId}:`, error);
      throw error;
    }
  }

  /**
   * Delete a match from an event
   */
  async deleteMatch(eventId: string, matchId: string): Promise<void> {
    try {
      await this.deleteData(`matches/${eventId}/${matchId}`);
    } catch (error) {
      console.error(`Error deleting match ${matchId} from event ${eventId}:`, error);
      throw error;
    }
  }
}
