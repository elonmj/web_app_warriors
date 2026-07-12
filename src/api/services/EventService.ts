import { FirebaseEventRepository } from '../repository/FirebaseEventRepository';
import { FirebasePlayerRepository } from '../repository/FirebasePlayerRepository'; // Assuming player repo is needed
import { Event, CreateEventInput, UpdateEventInput, EventMetadata } from '@/types/Event';
import { Match, PlayerMatchInfo } from '@/types/Match';
import { Player } from '@/types/Player';
import { EventRanking } from '@/types/Ranking';
import { MatchManager } from '@/lib/MatchManager';
import { RatingSystem } from '@/lib/RatingSystem'; // Import RatingSystem from lib
import {RatingService} from '@/api/services/RatingService'; // Import RatingService
import { EventStatus, PlayerCategoryType } from '@/types/Enums'; // Import PlayerCategoryType

export class EventService {
  private eventRepository: FirebaseEventRepository;
  private playerRepository: FirebasePlayerRepository;
  private ratingSystem: RatingSystem;
  private ratingService: RatingService;

  constructor() {
    this.eventRepository = new FirebaseEventRepository();
    this.playerRepository = new FirebasePlayerRepository();
    this.ratingSystem = new RatingSystem();
    this.ratingService = new RatingService();
  }

  /**
   * Get all events
   */
  async getEvents(): Promise<Event[]> {
    return this.eventRepository.getAllEvents();
  }

  /**
   * Get event by ID
   */
  async getEvent(id: string): Promise<Event | null> {
    return this.eventRepository.getEvent(id);
  }

  /**
   * Create new event
   */
  async createEvent(eventData: CreateEventInput): Promise<Event> {
    // The repository now handles status and metadata initialization.
    // We just need to ensure dates are Date objects.
    const dataForRepo: Omit<Event, 'id' | 'status' | 'metadata'> & { startDate: Date, endDate: Date } = {
      name: eventData.name,
      startDate: new Date(eventData.startDate),
      endDate: new Date(eventData.endDate),
      type: eventData.type,
    };
    // The repository's createEvent expects Omit<Event, 'id'>,
    // but it internally calculates status and metadata.
    // We pass the core fields, and the repo adds the rest.
    // A slight type assertion might be needed if TS complains,
    // but logically this aligns with the repo's implementation.
    return this.eventRepository.createEvent(dataForRepo as Omit<Event, 'id'>);
  }

  /**
   * Update event
   */
  async updateEvent(id: string, updates: UpdateEventInput): Promise<Event> {
    // Fetch current event to safely merge metadata if needed
    const currentEvent = await this.eventRepository.getEvent(id);
    if (!currentEvent) {
      throw new Error(`Event ${id} not found for update.`);
    }

    // Separate metadata from other updates
    const { metadata: metadataUpdate, ...otherUpdates } = updates;

    // Prepare the final update object for the repository, starting with non-metadata fields
    const finalUpdate: Partial<Event> = { ...otherUpdates };

    // Handle date conversions for fields present in otherUpdates
    if (otherUpdates.startDate) finalUpdate.startDate = new Date(otherUpdates.startDate);
    if (otherUpdates.endDate) finalUpdate.endDate = new Date(otherUpdates.endDate);

    // Process metadata separately and construct the correct EventMetadata object if needed
    let finalMetadata: EventMetadata | undefined = undefined;

    if (metadataUpdate) {
        // Define defaults for required EventMetadata fields
        const requiredDefaults: Pick<EventMetadata, 'totalPlayers' | 'totalMatches' | 'currentRound' | 'totalRounds' | 'roundHistory' | 'byeHistory'> = {
            totalPlayers: 0,
            totalMatches: 0,
            currentRound: 0,
            totalRounds: 0,
            roundHistory: {},
            byeHistory: [],
        };
        // Construct the full EventMetadata object
        finalMetadata = {
            ...requiredDefaults,
            ...(currentEvent.metadata || {}), // Merge existing
            ...metadataUpdate,               // Merge partial update
            lastUpdated: new Date().toISOString() // Set timestamp
        };
    } else if (Object.keys(otherUpdates).length > 0 && currentEvent.metadata) {
        // If only other fields changed and metadata exists, update its timestamp
        finalMetadata = {
            ...currentEvent.metadata,
            lastUpdated: new Date().toISOString()
        };
    } else if (currentEvent.metadata) {
        // If no updates but metadata exists, keep it as is (though updateEvent likely won't be called)
        finalMetadata = currentEvent.metadata;
    }
    // else: no metadata update, no other updates, or no existing metadata -> finalMetadata remains undefined

    // Assign the correctly typed metadata to the final update object if it was constructed
    if (finalMetadata !== undefined) {
        finalUpdate.metadata = finalMetadata;
    }

    // Pass the correctly typed finalUpdate to the repository
    return this.eventRepository.updateEvent(id, finalUpdate);
  }

  /**
   * Delete event
   */
  async deleteEvent(eventId: string): Promise<void> {
    // Add any business logic checks here if needed (e.g., check status)
    const event = await this.eventRepository.getEvent(eventId);
    if (!event) {
      throw new Error(`Event with ID ${eventId} not found`);
    }
    // Optional: Check if event status allows deletion (e.g., not 'in_progress')
    // if (event.status === EventStatus.IN_PROGRESS) {
    //   throw new Error(`Cannot delete event ${eventId} because it is in progress.`);
    // }

    await this.eventRepository.deleteEvent(eventId);
  }

  /**
   * Add a participant to an event
   */
  async addParticipant(eventId: string, playerId: string): Promise<void> {
    try {
      // Optional: Check if player exists before adding
      const player = await this.playerRepository.getPlayer(playerId);
      if (!player) {
        throw new Error(`Player with ID ${playerId} not found.`);
      }

      // Call repository method
      await this.eventRepository.addParticipant(eventId, playerId);
      console.log(`Service: Added participant ${playerId} to event ${eventId}`);

    } catch (error) {
      console.error(`Service Error adding participant ${playerId} to event ${eventId}:`, error);
      // Re-throw or handle specific errors
      if (error instanceof Error && error.message.includes('not found')) {
         throw error; // Propagate not found errors
      }
      throw new Error(`Failed to add participant: ${error instanceof Error ? error.message : 'Unknown service error'}`);
    }
  }

   /**
   * Remove a participant from an event
   */
  async removeParticipant(eventId: string, playerId: string): Promise<void> {
    try {
      // Optional: Add checks, e.g., cannot remove if matches played?
      const event = await this.eventRepository.getEvent(eventId);
      if (!event) {
        throw new Error(`Event with ID ${eventId} not found.`);
      }
      if (!event.playerIds?.includes(playerId)) {
         console.warn(`Service: Player ${playerId} not found in event ${eventId}, cannot remove.`);
         return; // Player not in event, nothing to do
      }

      // Call repository method
      await this.eventRepository.removeParticipant(eventId, playerId);
      console.log(`Service: Removed participant ${playerId} from event ${eventId}`);

    } catch (error) {
      console.error(`Service Error removing participant ${playerId} from event ${eventId}:`, error);
       if (error instanceof Error && error.message.includes('not found')) {
         throw error; // Propagate not found errors
      }
      throw new Error(`Failed to remove participant: ${error instanceof Error ? error.message : 'Unknown service error'}`);
    }
  }


  // --- Existing Methods (generatePairingsForRound, getRounds, etc.) ---
  // ... (Keep the rest of the existing methods like generatePairingsForRound, getRounds)

  /**
   * Generate pairings for a specific round of an event
   */
  async generatePairingsForRound(eventId: string, round: number): Promise<Match[]> {
    const event = await this.eventRepository.getEvent(eventId);
    if (!event) {
      throw new Error(`Event ${eventId} not found`);
    }
    if (!event.playerIds || event.playerIds.length === 0) {
      throw new Error(`Event ${eventId} has no participants`);
    }

    const players = await this.playerRepository.getPlayersByIds(event.playerIds);
    if (players.length !== event.playerIds.length) {
      console.warn("Mismatch between playerIds in event and fetched players");
      // Handle this case - maybe filter event.playerIds based on fetched players
    }

    // Pool de disponibilité (Règlement V2 §IV.A) : seuls les inscrits à la
    // ronde sont appariés ; sans liste, tous les participants sont réputés
    // disponibles. Ne pas s'inscrire est neutre — pas de match, pas de PR.
    const availability = event.metadata?.roundAvailability?.[round];
    const poolPlayers = availability
      ? players.filter((p) => availability.includes(p.id))
      : players;
    if (poolPlayers.length === 0) {
      throw new Error(`No available players for round ${round} of event ${eventId}`);
    }

    const previousMatches = await this.eventRepository.getEventMatches(eventId);

    // Initialize MatchManager
    const matchManager = new MatchManager(poolPlayers, previousMatches);

    // Generate pairings
    const pairings = matchManager.generatePairings(round);

    // Save pairings as matches
    const savedMatches: Match[] = [];
    for (const pairing of pairings) {
      const matchData: Omit<Match, 'id'> = {
       eventId: eventId,
       date: new Date().toISOString(),
       player1: {
         id: pairing.player1.id,
         ratingBefore: pairing.player1.currentRating,
         categoryBefore: this.ratingService.getCategory(pairing.player1.currentRating),
         name: pairing.player1.name,
         // Initialize with current values for new matches
         ratingAfter: pairing.player1.currentRating,
         categoryAfter: this.ratingService.getCategory(pairing.player1.currentRating)
       } as PlayerMatchInfo,
       player2: pairing.player2 ? {
         id: pairing.player2.id,
         ratingBefore: pairing.player2.currentRating,
         categoryBefore: this.ratingService.getCategory(pairing.player2.currentRating),
         name: pairing.player2.name,
         // Initialize with current values for new matches
         ratingAfter: pairing.player2.currentRating,
         categoryAfter: this.ratingService.getCategory(pairing.player2.currentRating)
       } as PlayerMatchInfo : {
         id: 'BYE',
         ratingBefore: 0,
         ratingAfter: 0,
         categoryBefore: 'ONYX',
         categoryAfter: 'ONYX'
       } as PlayerMatchInfo,
       status: 'pending',
       metadata: {
         round: round,
         isRandom: round === 1 && event.type === 'initial-random-pairing',
         createdAt: new Date().toISOString(),
         updatedAt: new Date().toISOString(),
       },
        // result: undefined, // No result initially
      };
      const savedMatch = await this.eventRepository.addEventMatch(eventId, matchData as Match); // Cast needed?
      savedMatches.push(savedMatch);
    }

     // Update event metadata (ensuring all required fields are present)
     const currentEvent = await this.eventRepository.getEvent(eventId);
     if (!currentEvent || !currentEvent.metadata) {
       throw new Error(`Event ${eventId} not found for metadata update`);
     }

     // Trace du bye de la ronde (Règlement V2 §IV.C)
     const byeMatch = savedMatches.find((m) => m.player2.id === 'BYE');
     const byeHistory = [...(currentEvent.metadata.byeHistory || [])];
     if (byeMatch) {
       const existing = byeHistory.find((b) => b.playerId === byeMatch.player1.id);
       if (existing) {
         existing.rounds = [...(existing.rounds || []), round];
         existing.lastByeRound = round;
       } else {
         byeHistory.push({ playerId: byeMatch.player1.id, rounds: [round], lastByeRound: round });
       }
     }

     const metadataUpdates: EventMetadata = {
       totalPlayers: currentEvent.metadata.totalPlayers || 0,
       totalMatches: (currentEvent.metadata.totalMatches || 0) + savedMatches.length,
       totalRounds: currentEvent.metadata.totalRounds || 0,
       currentRound: round,
       roundHistory: {
         ...(currentEvent.metadata.roundHistory || {}),
         [round]: {
           date: new Date().toISOString(),
           totalMatches: savedMatches.length,
           completedMatches: 0,
           ...(byeMatch ? { byePlayerId: byeMatch.player1.id } : {})
         }
       },
       byeHistory,
       roundAvailability: currentEvent.metadata.roundAvailability,
       lastUpdated: new Date().toISOString()
     };

     await this.eventRepository.updateEvent(eventId, { metadata: metadataUpdates });


    return savedMatches;
  }

  /**
   * Get all rounds information for an event
   */
  async getRounds(eventId: string): Promise<{ round: number; date?: string; status: string }[]> {
    const event = await this.eventRepository.getEvent(eventId);
    if (!event || !event.metadata) {
      throw new Error(`Event ${eventId} or its metadata not found`);
    }

    const roundsInfo: { round: number; date?: string; status: string }[] = [];
    const roundHistory = event.metadata.roundHistory || {};
    const totalRounds = event.metadata.totalRounds || 0; // Use totalRounds if defined

    // Infer rounds from history or totalRounds
    const roundsToDisplay = totalRounds > 0 ? totalRounds : Object.keys(roundHistory).length;

    for (let i = 1; i <= roundsToDisplay; i++) {
      const roundData = roundHistory[i];
      roundsInfo.push({
        round: i,
        date: roundData?.date,
        // Determine status based on completion or current round
        status: roundData?.completedAt ? 'completed' : (i === event.metadata.currentRound ? 'in_progress' : 'pending')
      });
    }

     // If no rounds in history and totalRounds is 0, maybe return empty or based on currentRound
     if (roundsToDisplay === 0 && event.metadata.currentRound > 0) {
        // Handle case where event started but no rounds recorded in history yet
        roundsInfo.push({ round: 1, status: 'in_progress' });
     }


    return roundsInfo;
  }

  /**
   * Get rankings for a specific round
   */
  async getRoundRankings(eventId: string, round: number): Promise<EventRanking | null> {
    return this.eventRepository.getRoundRankings(eventId, round);
  }

  /**
   * Save rankings for a specific round
   */
  async saveRoundRankings(eventId: string, round: number, rankings: EventRanking): Promise<void> {
    await this.eventRepository.saveRoundRankings(eventId, round, rankings);
  }

  /**
   * Complete the current round of an event
   */
  async completeRound(eventId: string, round: number): Promise<void> {
    const event = await this.eventRepository.getEvent(eventId);
    if (!event || !event.metadata) {
      throw new Error(`Event ${eventId} not found`);
    }

    // 1. Mark current round as completed
    const roundHistory = { ...(event.metadata.roundHistory || {}) };
    if (roundHistory[round]) {
      roundHistory[round] = {
        ...roundHistory[round],
        completedAt: new Date().toISOString()
      };
    }

    const totalRounds = event.metadata.totalRounds || 0;
    
    if (round < totalRounds) {
      // 2. Generate next round pairings and update currentRound
      const nextRound = round + 1;
      await this.generatePairingsForRound(eventId, nextRound);
      
      // Update the roundHistory completedAt for the previous round
      const currentEvent = await this.eventRepository.getEvent(eventId);
      if (currentEvent && currentEvent.metadata) {
        const updatedMetadata = {
          ...currentEvent.metadata,
          roundHistory: {
            ...currentEvent.metadata.roundHistory,
            [round]: {
              ...currentEvent.metadata.roundHistory[round],
              completedAt: new Date().toISOString()
            }
          }
        };
        await this.eventRepository.updateEvent(eventId, { metadata: updatedMetadata });
      }
    } else {
      // 3. Last round completed, mark event as closed
      await this.eventRepository.updateEvent(eventId, {
        status: EventStatus.CLOSED,
        metadata: {
          ...event.metadata,
          roundHistory,
          lastCompletedRound: round,
          lastUpdated: new Date().toISOString()
        }
      });
    }
  }

  /**
   * Undo the completion of the current round (go back to previous round)
   */
  async undoCompleteRound(eventId: string): Promise<void> {
    const event = await this.eventRepository.getEvent(eventId);
    if (!event || !event.metadata) {
      throw new Error(`Event ${eventId} not found`);
    }

    const currentRound = event.metadata.currentRound;
    if (currentRound <= 1) {
      throw new Error("Cannot undo round completion before round 1");
    }

    const prevRound = currentRound - 1;

    // 1. Delete all matches of the current round using public deleteMatch repo method
    const currentRoundMatches = await this.eventRepository.getRoundMatches(eventId, currentRound);
    for (const match of currentRoundMatches) {
      await this.eventRepository.deleteMatch(eventId, match.id);
    }

    // 2. Update metadata
    const roundHistory = { ...(event.metadata.roundHistory || {}) };
    delete roundHistory[currentRound];
    if (roundHistory[prevRound]) {
      // Mark previous round as in progress (remove completedAt)
      const { completedAt, ...prevRoundStats } = roundHistory[prevRound];
      roundHistory[prevRound] = prevRoundStats as any;
    }

    const metadataUpdates: EventMetadata = {
      ...event.metadata,
      currentRound: prevRound,
      roundHistory,
      lastUpdated: new Date().toISOString()
    };

    // If event was marked as closed, revert to IN_PROGRESS
    const statusUpdate = event.status === EventStatus.CLOSED ? { status: EventStatus.IN_PROGRESS } : {};

    await this.eventRepository.updateEvent(eventId, {
      ...statusUpdate,
      metadata: metadataUpdates
    });
  }

  /**
   * Generate projected pairings for a round without saving to DB
   */
  async generateProjectedPairings(eventId: string, round: number): Promise<Match[]> {
    const event = await this.eventRepository.getEvent(eventId);
    if (!event) {
      throw new Error(`Event ${eventId} not found`);
    }
    if (!event.playerIds || event.playerIds.length === 0) {
      throw new Error(`Event ${eventId} has no participants`);
    }

    const players = await this.playerRepository.getPlayersByIds(event.playerIds);
    const previousMatches = await this.eventRepository.getEventMatches(eventId);

    // Même pool de disponibilité que la génération réelle (§IV.A)
    const availability = event.metadata?.roundAvailability?.[round];
    const poolPlayers = availability
      ? players.filter((p) => availability.includes(p.id))
      : players;

    // Initialize MatchManager
    const matchManager = new MatchManager(poolPlayers, previousMatches);

    // Generate pairings
    const pairings = matchManager.generatePairings(round);

    // Map pairings to Match objects without saving to DB
    const projectedMatches: Match[] = pairings.map((pairing, index) => {
      return {
        id: `projected-${index}-${pairing.player1.id}-${pairing.player2?.id || 'BYE'}`,
        eventId: eventId,
        date: new Date().toISOString().split('T')[0],
        player1: {
          id: pairing.player1.id,
          ratingBefore: pairing.player1.currentRating,
          categoryBefore: this.ratingService.getCategory(pairing.player1.currentRating),
          name: pairing.player1.name,
          ratingAfter: pairing.player1.currentRating,
          categoryAfter: this.ratingService.getCategory(pairing.player1.currentRating)
        } as PlayerMatchInfo,
        player2: pairing.player2 ? {
          id: pairing.player2.id,
          ratingBefore: pairing.player2.currentRating,
          categoryBefore: this.ratingService.getCategory(pairing.player2.currentRating),
          name: pairing.player2.name,
          ratingAfter: pairing.player2.currentRating,
          categoryAfter: this.ratingService.getCategory(pairing.player2.currentRating)
        } as PlayerMatchInfo : {
          id: 'BYE',
          name: 'BYE',
          ratingBefore: 0,
          ratingAfter: 0,
          categoryBefore: 'ONYX',
          categoryAfter: 'ONYX'
        } as PlayerMatchInfo,
        status: 'pending',
        metadata: {
          round: round,
          isRandom: round === 1 && event.type === 'initial-random-pairing',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      };
    });

    return projectedMatches;
  }

  /**
   * Generate pairings for the next round (called by /pairings API endpoint)
   */
  async generatePairings(eventId: string, options?: any): Promise<{ matches: Match[], warnings: string[] }> {
    const event = await this.eventRepository.getEvent(eventId);
    if (!event || !event.metadata) {
      throw new Error(`Event ${eventId} not found`);
    }
    const nextRound = event.metadata.currentRound + 1;
    const matches = await this.generateProjectedPairings(eventId, nextRound);
    return { matches, warnings: [] };
  }
}
