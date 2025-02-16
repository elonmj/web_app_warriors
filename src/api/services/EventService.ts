import type { Event, ByeHistory } from '../../types/Event';
import type { Match, PlayerMatchInfo } from '../../types/Match';
import type { Player } from '../../types/Player';
import type { MatchStatus } from '../../types/MatchStatus';
import { PlayerCategoryType, ValidationStatus } from '../../types/Enums';
import type { ValidationStatusType } from '../../types/Enums';
import { BaseRepository } from '../repository/BaseRepository';
import { shouldAvoidRematch, createPlayerPairKey } from '../../types/MatchHistory';

interface CategoryBalanceMetrics {
  crossCategoryMatches: number;
  sameCategoryMatches: number;
  categorySpread: Record<PlayerCategoryType, number>;
}

interface PairingOptions {
  avoidRematches: boolean;
  balanceCategories: boolean;
}

interface GeneratePairingsResult {
  round: number;
  matches: Match[];
  warnings?: string[];
}

interface RoundPairings {
  round: number;
  scheduledDate: string;
  matches: Match[];
  metadata: {
    totalMatches: number;
    completedMatches: number;
    pendingMatches: number;
  }
}

interface CreateEventInput {
  name: string;
  startDate: Date;
  endDate: Date;
}

interface GenerateMatchesResponse {
  eventId: number;
  matches: Array<Match>;
  totalGenerated: number;
}

export class EventService extends BaseRepository {
  /**
   * Create a new event
   */
  async createEvent(input: CreateEventInput): Promise<Event> {
    // Implementation here
    throw new Error('Not implemented');
  }

  /**
   * Close an event
   */
  async closeEvent(eventId: number): Promise<Event> {
    // Implementation here
    throw new Error('Not implemented');
  }

  /**
   * Reopen a closed event
   */
  async reopenEvent(eventId: number): Promise<Event> {
    // Implementation here
    throw new Error('Not implemented');
  }

  /**
   * Generate matches for an event
   */
  async generateMatches(eventId: number): Promise<Array<Match>> {
    // Implementation here
    throw new Error('Not implemented');
  }

  /**
   * Get an event by ID
   */
  async getEvent(eventId: string): Promise<Event | null> {
    try {
      const events = await this.readJsonFile<Event[]>('events.json');
      return events.find(e => e.id === eventId) || null;
    } catch (error) {
      console.error('Failed to fetch event:', error);
      return null;
    }
  }

  /**
   * Get all matches for an event
   */
  async getEventMatches(eventId: string): Promise<Match[]> {
    try {
      const data = await this.readJsonFile<{ matches: Match[] }>(`matches/${eventId}.json`);
      return data.matches || [];
    } catch (error) {
      console.error('Failed to fetch matches:', error);
      return [];
    }
  }

 /**
  * Get current round number for event
  */
 async getCurrentRound(eventId: string): Promise<number> {
   const event = await this.getEvent(eventId);
   return event?.metadata?.currentRound || 1;
 }

 /**
  * Get all pairings for specific round
  */
 async getRoundPairings(eventId: string, round: number): Promise<RoundPairings> {
   const [event, matches] = await Promise.all([
     this.getEvent(eventId),
     this.getEventMatches(eventId)
   ]);

   if (!event) throw new Error('Event not found');

   const roundMatches = matches.filter(m => m.metadata?.round === round);
   const completedMatches = roundMatches.filter(m => m.status === 'completed');

   return {
     round,
     scheduledDate: event.metadata?.roundDates?.[round] || new Date().toISOString(),
     matches: roundMatches,
     metadata: {
       totalMatches: roundMatches.length,
       completedMatches: completedMatches.length,
       pendingMatches: roundMatches.length - completedMatches.length
     }
   };
 }

 /**
  * Generate new round of pairings
  */
 async generatePairings(
   eventId: string,
   options: PairingOptions
 ): Promise<GeneratePairingsResult> {
   const [event, players, existingMatches] = await Promise.all([
     this.getEvent(eventId),
     this.getEventPlayers(eventId),
     this.getEventMatches(eventId)
   ]);

   if (!event) throw new Error('Event not found');

   const currentRound = (event.metadata?.currentRound || 0) + 1;
   
   // Handle odd number of players with bye
   let activePlayers = [...players];
   let byeMatch: Match | undefined;
   
   if (players.length % 2 !== 0) {
     const { byePlayer, byeMatch: newByeMatch } = await this.assignBye(
       eventId,
       players,
       event.metadata?.byeHistory || []
     );
     // Set the correct round for the bye match
     newByeMatch.metadata.round = currentRound;
     byeMatch = newByeMatch;
     
     // Update bye history
     await this.updateByeHistory(eventId, byePlayer.id, currentRound);
     
     // Remove bye player from active players
     activePlayers = activePlayers.filter(p => p.id !== byePlayer.id);
   }
   
   // Sort remaining players by rating and generate initial pairings
   const sortedPlayers = activePlayers.sort((a, b) => b.currentRating - a.currentRating);
   const midpoint = Math.floor(sortedPlayers.length / 2);
   const topHalf = sortedPlayers.slice(0, midpoint);
   const bottomHalf = sortedPlayers.slice(midpoint);

   let pairings = topHalf.map((player1, index) => ({
     player1,
     player2: bottomHalf[index]
   }));

   // Apply constraints if enabled
   const warnings: string[] = [];

   if (options.avoidRematches) {
     pairings = await this.adjustForRematches(pairings, existingMatches, warnings);
   }

   if (options.balanceCategories) {
     pairings = await this.balanceCategoryPairings(pairings, warnings);
   }

   // Create match objects for the pairings
   const now = new Date().toISOString();
   const matches = pairings.map(pairing => ({
     id: `${eventId}-R${currentRound}-${pairing.player1.id}-${pairing.player2.id}`,
     eventId,
     date: now,
     player1: {
       id: pairing.player1.id,
       ratingBefore: pairing.player1.currentRating,
       ratingAfter: pairing.player1.currentRating, // Initial value same as before
       categoryBefore: pairing.player1.category as PlayerCategoryType,
       categoryAfter: pairing.player1.category as PlayerCategoryType // Initial value same as before
     },
     player2: {
       id: pairing.player2.id,
       ratingBefore: pairing.player2.currentRating,
       ratingAfter: pairing.player2.currentRating, // Initial value same as before
       categoryBefore: pairing.player2.category as PlayerCategoryType,
       categoryAfter: pairing.player2.category as PlayerCategoryType // Initial value same as before
     },
     status: 'pending' as MatchStatus,
     metadata: {
       round: currentRound,
       isRandom: false,
       createdAt: now,
       updatedAt: now
     }
   }));

   // Combine regular matches with bye match if it exists
   const allMatches = byeMatch ? [...matches, byeMatch] : matches;

   return {
     round: currentRound,
     matches: allMatches,
     warnings: warnings.length > 0 ? warnings : undefined
   };
 }

 /**
  * Adjust pairings to avoid recent rematches
  */
 /**
  * Assign a bye for a round
  */
 /**
  * Complete a round and prepare for the next one
  */
 async completeRound(
   eventId: string,
   round: number
 ): Promise<void> {
   const [event, matches] = await Promise.all([
     this.getEvent(eventId),
     this.getEventMatches(eventId)
   ]);

   if (!event) throw new Error('Event not found');

   // Get matches for the current round
   const roundMatches = matches.filter(m => m.metadata.round === round);
   
   // Verify all matches are completed
   const incompletedMatches = roundMatches.filter(m => m.status !== 'completed');
   if (incompletedMatches.length > 0) {
     throw new Error(`Cannot complete round ${round}. ${incompletedMatches.length} matches still pending.`);
   }

   // Update event metadata
   if (!event.metadata) {
     throw new Error('Event metadata not initialized');
   }

   // Update round history
   event.metadata.roundHistory[round] = {
     date: new Date().toISOString(),
     totalMatches: roundMatches.length,
     completedMatches: roundMatches.length,
     byePlayerId: roundMatches.find(m => m.player2.id === 'BYE')?.player1.id
   };

   // Update current round
   event.metadata.currentRound = round + 1;
   event.metadata.lastUpdated = new Date().toISOString();

   // Save updated event
   const events = await this.readJsonFile<Event[]>('events.json');
   const eventIndex = events.findIndex(e => e.id === eventId);
   if (eventIndex >= 0) {
     events[eventIndex] = event;
     await this.writeJsonFile('events.json', events);
   }
 }

 private async getEventPlayerCount(eventId: string): Promise<number> {
   const players = await this.getEventPlayers(eventId);
   return players.length;
 }

 private async updateByeHistory(
   eventId: string,
   playerId: string,
   round: number
 ): Promise<void> {
   const event = await this.getEvent(eventId);
   if (!event) throw new Error('Event not found');

   // Initialize or update metadata
   if (!event.metadata) {
     const [matches, playerCount] = await Promise.all([
       this.getEventMatches(eventId),
       this.getEventPlayerCount(eventId)
     ]);
     const now = new Date().toISOString();
     
     event.metadata = {
       totalPlayers: playerCount,
       totalMatches: matches.length,
       currentRound: round,
       totalRounds: 0, // Will be set based on event configuration
       lastUpdated: now,
       roundHistory: {},
       byeHistory: []
     };
   }

   // Update or create bye history entry
   const byeHistory = event.metadata.byeHistory;
   const existingHistory = byeHistory.find(h => h.playerId === playerId);
   if (existingHistory) {
     existingHistory.rounds.push(round);
     existingHistory.lastByeRound = round;
   } else {
     byeHistory.push({
       playerId,
       rounds: [round],
       lastByeRound: round
     });
   }

   // Update the last updated timestamp
   event.metadata.lastUpdated = new Date().toISOString();

   // Save updated event
   const events = await this.readJsonFile<Event[]>('events.json');
   const eventIndex = events.findIndex(e => e.id === eventId);
   if (eventIndex >= 0) {
     events[eventIndex] = event;
     await this.writeJsonFile('events.json', events);
   }
 }

 private async assignBye(
   eventId: string,
   players: Player[],
   byeHistory: ByeHistory[]
 ): Promise<{ byePlayer: Player, byeMatch: Match }> {
   // Sort players by last bye round (undefined = never had a bye)
   const sortedPlayers = [...players].sort((a, b) => {
     const aLastBye = byeHistory.find(h => h.playerId === a.id)?.lastByeRound;
     const bLastBye = byeHistory.find(h => h.playerId === b.id)?.lastByeRound;
     if (aLastBye === undefined) return -1;
     if (bLastBye === undefined) return 1;
     return aLastBye - bLastBye;
   });

   const byePlayer = sortedPlayers[0];
   const now = new Date().toISOString();

   // Create a bye match
   const byeMatch: Match = {
     id: `${eventId}-bye-${byePlayer.id}`,
     eventId,
     date: now,
     player1: {
       id: byePlayer.id,
       ratingBefore: byePlayer.currentRating,
       ratingAfter: byePlayer.currentRating,
       categoryBefore: byePlayer.category as PlayerCategoryType,
       categoryAfter: byePlayer.category as PlayerCategoryType
     },
     player2: {
       id: 'BYE',
       ratingBefore: 0,
       ratingAfter: 0,
       categoryBefore: 'NONE' as PlayerCategoryType,
       categoryAfter: 'NONE' as PlayerCategoryType
     },
     status: 'completed' as MatchStatus,
     result: {
       score: [1, 0],
       pr: 3,  // Win by default
       pdi: 0,
       ds: 0,
       validation: {
         player1Approved: true,
         player2Approved: true,
         timestamp: now,
         status: ValidationStatus.ADMIN_VALIDATED
       }
     },
     metadata: {
       round: 0, // Will be set by caller
       isRandom: false,
       createdAt: now,
       updatedAt: now
     }
   };

   return { byePlayer, byeMatch };
 }

 /**
  * Adjust pairings to avoid recent rematches
  */
 private async adjustForRematches(
   pairings: Array<{player1: Player, player2: Player}>,
   existingMatches: Match[],
   warnings: string[]
 ): Promise<Array<{player1: Player, player2: Player}>> {
   // Convert existing matches to history format
   const matchHistory = existingMatches.map(match => ({
     playerIds: [match.player1.id, match.player2.id].sort() as [string, string],
     rounds: [match.metadata.round],
     lastMatchDate: match.date
   }));

   // Check each pairing for recent matches
   const adjustedPairings = [...pairings];
   for (let i = 0; i < adjustedPairings.length; i++) {
     const pair = adjustedPairings[i];
     if (shouldAvoidRematch(matchHistory, pair.player1.id, pair.player2.id, 0, 3)) {
       // Try to swap with next pair if possible
       if (i < adjustedPairings.length - 1) {
         const nextPair = adjustedPairings[i + 1];
         // Check if swapping reduces rematches
         if (!shouldAvoidRematch(matchHistory, pair.player1.id, nextPair.player2.id, 0, 3) &&
             !shouldAvoidRematch(matchHistory, nextPair.player1.id, pair.player2.id, 0, 3)) {
           // Swap player2s between pairs
           const temp = pair.player2;
           adjustedPairings[i].player2 = nextPair.player2;
           adjustedPairings[i + 1].player2 = temp;
         } else {
           warnings.push(`Could not avoid rematch between ${pair.player1.id} and ${pair.player2.id}`);
         }
       }
     }
   }

   return adjustedPairings;
 }

 /**
  * Adjust pairings to balance category matchups
  */
 private async balanceCategoryPairings(
   pairings: Array<{player1: Player, player2: Player}>,
   warnings: string[]
 ): Promise<Array<{player1: Player, player2: Player}>> {
   // Calculate current category metrics
   const metrics: CategoryBalanceMetrics = {
     crossCategoryMatches: 0,
     sameCategoryMatches: 0,
     categorySpread: {} as Record<PlayerCategoryType, number>
   };

   pairings.forEach(pair => {
     if (pair.player1.category === pair.player2.category) {
       metrics.sameCategoryMatches++;
     } else {
       metrics.crossCategoryMatches++;
     }

     // Track category appearances
     metrics.categorySpread[pair.player1.category] = (metrics.categorySpread[pair.player1.category] || 0) + 1;
     metrics.categorySpread[pair.player2.category] = (metrics.categorySpread[pair.player2.category] || 0) + 1;
   });

   // If too many same-category matches, try to balance
   if (metrics.sameCategoryMatches > metrics.crossCategoryMatches) {
     const adjustedPairings = [...pairings];
     for (let i = 0; i < adjustedPairings.length - 1; i++) {
       const pair1 = adjustedPairings[i];
       const pair2 = adjustedPairings[i + 1];

       // If both pairs are same-category matches
       if (pair1.player1.category === pair1.player2.category &&
           pair2.player1.category === pair2.player2.category) {
         // Swap player2s to create cross-category matches
         const temp = pair1.player2;
         adjustedPairings[i].player2 = pair2.player2;
         adjustedPairings[i + 1].player2 = temp;
         i++; // Skip next pair since we've already processed it
       }
     }
     return adjustedPairings;
   }

   return pairings;
 }

 /**
  * Get players participating in an event
  */
 private async getEventPlayers(eventId: string): Promise<Player[]> {
   try {
     const { players } = await this.readJsonFile<{ players: Player[] }>('players.json');
     // In a real implementation, we would filter players by event participation
     return players || [];
   } catch (error) {
     console.error('Failed to fetch players:', error);
     return [];
   }
 }
}

export type {
 CreateEventInput,
 GenerateMatchesResponse,
 PairingOptions,
 GeneratePairingsResult,
 RoundPairings
};