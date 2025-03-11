import { 
  ref, 
  get, 
  query as dbQuery,
  orderByChild, 
  equalTo 
} from 'firebase/database';
import { FirebaseBaseRepository } from './FirebaseBaseRepository';
import { Match } from '@/types/Match';

export class FirebaseMatchRepository extends FirebaseBaseRepository {
  /**
   * Get match by ID
   */
  async getMatch(matchId: string): Promise<Match | null> {
    try {
      // Since we store matches under events, we need to search through all events
      const events = await this.getData<Record<string, any>>('events');
      if (!events) return null;
      
      // Check each event's matches
      for (const eventId of Object.keys(events)) {
        const matchData = await this.getData<any>(`matches/${eventId}/${matchId}`);
        if (matchData) {
          return this.createMatchObject(matchData, matchId, eventId);
        }
      }
      
      return null;
    } catch (error) {
      console.error(`Error getting match ${matchId}:`, error);
      return null;
    }
  }

  /**
   * Get all matches for an event
   */
  async getEventMatches(eventId: string): Promise<Match[]> {
    try {
      const data = await this.getData<Record<string, any>>(`matches/${eventId}`);
      if (!data) return [];
      
      // Transform data to proper Match objects, ensuring all required fields are present
      return this.objectToArray<any, Match>(
        data,
        (matchData, id) => this.createMatchObject(matchData, id, eventId)
      );
    } catch (error) {
      console.error(`Error getting matches for event ${eventId}:`, error);
      return [];
    }
  }

  /**
   * Get matches for a specific round in an event
   */
  async getRoundMatches(eventId: string, round: number): Promise<Match[]> {
    try {
      // Use query with orderByChild and equalTo for filtering by round
      const matchesQuery = dbQuery(
        ref(this.db, `matches/${eventId}`),
        orderByChild('metadata/round'),
        equalTo(round)
      );
      
      const snapshot = await get(matchesQuery);
      if (!snapshot.exists()) {
        return [];
      }
      
      const matchesData = snapshot.val();
      return this.objectToArray<any, Match>(
        matchesData, 
        (data, id) => this.createMatchObject(data, id, eventId)
      );
    } catch (error) {
      console.error(`Error getting round ${round} matches for event ${eventId}:`, error);
      return [];
    }
  }

  /**
   * Get all matches (across all events)
   */
  async getAllMatches(): Promise<Match[]> {
    try {
      const events = await this.getData<Record<string, any>>('events');
      if (!events) return [];
      
      const allMatches: Match[] = [];
      
      // Get matches from each event
      for (const eventId of Object.keys(events)) {
        const eventMatches = await this.getEventMatches(eventId);
        allMatches.push(...eventMatches);
      }
      
      return allMatches;
    } catch (error) {
      console.error('Error getting all matches:', error);
      return [];
    }
  }

  // Helper method to create a properly formed Match object
  private createMatchObject(data: any, id: string, eventId: string): Match {
    return {
      id,
      eventId,
      date: data?.date || new Date().toISOString(),
      player1: {
        id: data?.player1?.id || '',
        ratingBefore: data?.player1?.ratingBefore || 1000,
        ratingAfter: data?.player1?.ratingAfter || 1000,
        categoryBefore: data?.player1?.categoryBefore || 'ONYX',
        categoryAfter: data?.player1?.categoryAfter || 'ONYX',
        name: data?.player1?.name
      },
      player2: {
        id: data?.player2?.id || '',
        ratingBefore: data?.player2?.ratingBefore || 1000,
        ratingAfter: data?.player2?.ratingAfter || 1000,
        categoryBefore: data?.player2?.categoryBefore || 'ONYX',
        categoryAfter: data?.player2?.categoryAfter || 'ONYX',
        name: data?.player2?.name
      },
      status: data?.status || 'pending',
      result: data?.result,
      metadata: {
        round: data?.metadata?.round || 1,
        isRandom: data?.metadata?.isRandom || false,
        createdAt: data?.metadata?.createdAt || new Date().toISOString(),
        updatedAt: data?.metadata?.updatedAt || new Date().toISOString()
      }
    };
  }
}
