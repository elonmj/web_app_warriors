import { FirebaseEventRepository } from '../repository/FirebaseEventRepository';
import { FirebasePlayerRepository } from '../repository/FirebasePlayerRepository';
import { Event } from '@/types/Event';
import { Match } from '@/types/Match';
import { EventStatusType } from '@/types/Enums';
import { Player } from '@/types/Player';
import { calculateCategory } from '@/lib/categoryUtils';
import { EventRanking, PlayerRanking } from '@/types/Ranking';
import { PlayerPairHistory, createPlayerPairKey } from '@/types/MatchHistory';
import { RankingService } from './RankingService';

export class EventService {
  private eventRepository: FirebaseEventRepository;
  private playerRepository: FirebasePlayerRepository;

  constructor() {
    this.eventRepository = new FirebaseEventRepository();
    this.playerRepository = new FirebasePlayerRepository();
  }

  /**
   * Get event details
   */
  async getEvent(eventId: string): Promise<Event | null> {
    return this.eventRepository.getEvent(eventId);
  }

  /**
   * Generate pairings for a new round
   */
  async generatePairings(
    eventId: string,
    options: {
      avoidRematches?: boolean;
      balanceCategories?: boolean;
      isFirstRound?: boolean;
    } = {}
  ): Promise<{
    round: number;
    matches: Match[];
    warnings: string[];
  }> {
    // Get event and validate
    const event = await this.eventRepository.getEvent(eventId);
    if (!event || !event.metadata) {
      throw new Error('Event not found or invalid');
    }

    // Get all event participants
    const players = await this.playerRepository.getAllPlayers();

    // Get next round number
    const currentRound = event.metadata.currentRound || 0;
    const nextRound = currentRound + 1;

    // Get all existing matches to build history
    const existingMatches = await this.eventRepository.getEventMatches(eventId);
    
    // Extract match history for rematch prevention
    const matchHistory: PlayerPairHistory[] = [];
    if (options.avoidRematches && existingMatches.length > 0) {
      // Process existing matches to build pair history
      existingMatches.forEach((m: Match) => {
        const p1 = m.player1.id;
        const p2 = m.player2.id;
        
        // Skip BYE matches
        if (p2 === 'BYE') return;
        
        const pairKey = createPlayerPairKey(p1, p2);
        
        // Find or create history entry
        let historyEntry = matchHistory.find(h => 
          createPlayerPairKey(h.playerIds[0], h.playerIds[1]) === pairKey
        );
        
        if (!historyEntry) {
          historyEntry = {
            playerIds: [p1, p2],
            rounds: [],
            lastMatchDate: m.date
          };
          matchHistory.push(historyEntry);
        }
        
        // Add the round to match history
        if (m.metadata?.round) {
          historyEntry.rounds.push(m.metadata.round);
        }
        
        // Update last match date if newer
        if (new Date(m.date) > new Date(historyEntry.lastMatchDate)) {
          historyEntry.lastMatchDate = m.date;
        }
      });
    }

    // Create pairings
    const { matches, warnings } = await this.createPairings(
      eventId,
      nextRound,
      players,
      matchHistory,
      options
    );

    return {
      round: nextRound,
      matches,
      warnings
    };
  }

  /**
   * Create pairings for a round
   */
  private async createPairings(
    eventId: string,
    round: number,
    players: Player[],
    matchHistory: PlayerPairHistory[],
    options: {
      avoidRematches?: boolean;
      balanceCategories?: boolean;
      isFirstRound?: boolean;
    }
  ): Promise<{ matches: Match[]; warnings: string[] }> {
    const warnings: string[] = [];
    const now = new Date().toISOString();
    
    // Sort players by rating
    const sortedPlayers = [...players].sort((a, b) => b.currentRating - a.currentRating);
    
    // Create matches array
    const matches: Match[] = [];
    const pairedPlayers = new Set<string>();
    
    // Helper function to create a match between two players
    const createMatch = (player1: Player, player2: Player | 'BYE'): Match => {
      const isByeMatch = player2 === 'BYE';
      
      const matchId = `${eventId}-R${round}-${Date.now()}-${player1.id}-${isByeMatch ? 'BYE' : player2.id}`;
      const match: Match = {
        id: matchId,
        eventId,
        date: now.split('T')[0],
        player1: {
          id: player1.id,
          ratingBefore: player1.currentRating,
          ratingAfter: player1.currentRating,
          categoryBefore: player1.category,
          categoryAfter: player1.category,
          name: player1.name
        },
        player2: isByeMatch 
          ? {
              id: 'BYE',
              ratingBefore: 1000,
              ratingAfter: 1000,
              categoryBefore: 'ONYX',
              categoryAfter: 'ONYX'
            }
          : {
              id: player2.id,
              ratingBefore: player2.currentRating,
              ratingAfter: player2.currentRating,
              categoryBefore: player2.category,
              categoryAfter: player2.category,
              name: player2.name
            },
        status: isByeMatch ? 'completed' : 'pending',
        metadata: {
          round,
          isRandom: false,
          createdAt: now,
          updatedAt: now
        }
      };
      
      return match;
    };
    
    // Helper to check if two players have played recently
    const havePlayedRecently = (p1: string, p2: string): boolean => {
      if (!options.avoidRematches) return false;
      
      const pairKey = createPlayerPairKey(p1, p2);
      const history = matchHistory.find(h => 
        createPlayerPairKey(h.playerIds[0], h.playerIds[1]) === pairKey
      );
      
      if (!history) return false;
      
      // Check if they played in the last 2 rounds
      return history.rounds.some(r => r >= round - 2);
    };
    
    // First round uses simple pairing
    if (options.isFirstRound) {
      for (let i = 0; i < sortedPlayers.length; i += 2) {
        if (i + 1 < sortedPlayers.length) {
          matches.push(createMatch(sortedPlayers[i], sortedPlayers[i + 1]));
          pairedPlayers.add(sortedPlayers[i].id);
          pairedPlayers.add(sortedPlayers[i + 1].id);
        } else {
          // Odd number of players, create a bye
          matches.push(createMatch(sortedPlayers[i], 'BYE'));
          pairedPlayers.add(sortedPlayers[i].id);
          warnings.push(`Player ${sortedPlayers[i].name} received a bye for round ${round}.`);
        }
      }
      
      return { matches, warnings };
    }
    
    // For subsequent rounds, get rankings and use Swiss pairing
    // Get event rankings if available
    const event = await this.eventRepository.getEvent(eventId);
    const previousRound = round - 1;
    const rankings = await this.eventRepository.getRoundRankings(eventId, previousRound);
    
    if (!rankings) {
      warnings.push(`No rankings available for round ${previousRound}. Using ratings-based pairing.`);
      
      // Fall back to rating-based pairing
      for (let i = 0; i < sortedPlayers.length; i += 2) {
        if (i + 1 < sortedPlayers.length) {
          matches.push(createMatch(sortedPlayers[i], sortedPlayers[i + 1]));
          pairedPlayers.add(sortedPlayers[i].id);
          pairedPlayers.add(sortedPlayers[i + 1].id);
        } else {
          // Odd number of players, create a bye
          matches.push(createMatch(sortedPlayers[i], 'BYE'));
          pairedPlayers.add(sortedPlayers[i].id);
          warnings.push(`Player ${sortedPlayers[i].name} received a bye for round ${round}.`);
        }
      }
      
      return { matches, warnings };
    }
    
    // Sort players by ranking
    const rankedPlayers = sortedPlayers
      .map(player => {
        const ranking = rankings.rankings.find(r => r.playerId === player.id);
        return {
          player,
          rank: ranking ? ranking.rank : sortedPlayers.length
        };
      })
      .sort((a, b) => a.rank - b.rank);
      
    // Create pairings based on Swiss system
    const remainingPlayers = [...rankedPlayers];
    
    while (remainingPlayers.length > 1) {
      const current = remainingPlayers.shift()!;
      let bestMatch = -1;
      
      // Find the best match for current player
      for (let i = 0; i < remainingPlayers.length; i++) {
        if (!havePlayedRecently(current.player.id, remainingPlayers[i].player.id)) {
          bestMatch = i;
          break;
        }
      }
      
      // If no suitable match found, use the next available player
      if (bestMatch === -1) {
        bestMatch = 0;
        warnings.push(`Couldn't avoid rematch for ${current.player.name} in round ${round}.`);
      }
      
      const opponent = remainingPlayers.splice(bestMatch, 1)[0];
      matches.push(createMatch(current.player, opponent.player));
      pairedPlayers.add(current.player.id);
      pairedPlayers.add(opponent.player.id);
    }
    
    // Check if there's one player left for a bye
    if (remainingPlayers.length === 1) {
      const byePlayer = remainingPlayers[0].player;
      matches.push(createMatch(byePlayer, 'BYE'));
      pairedPlayers.add(byePlayer.id);
      warnings.push(`Player ${byePlayer.name} received a bye for round ${round}.`);
    }
    
    return { matches, warnings };
  }

  /**
   * Get active players in an event
   */
  async getEventPlayers(eventId: string): Promise<Player[]> {
    const event = await this.eventRepository.getEvent(eventId);
    if (!event) {
      throw new Error('Event not found');
    }
    
    const allPlayers = await this.playerRepository.getAllPlayers();
    
    // If we had player registrations, we'd filter here
    return allPlayers;
  }

  /**
   * Start an event
   */
  async startEvent(eventId: string): Promise<Event> {
    const event = await this.eventRepository.getEvent(eventId);
    if (!event) {
      throw new Error('Event not found');
    }
    
    const updates = {
      status: 'in_progress' as EventStatusType,
      metadata: {
        ...event.metadata,
        currentRound: 1,
        lastUpdated: new Date().toISOString()
,
        totalPlayers: event.metadata?.totalPlayers || 0,
        totalMatches: event.metadata?.totalMatches || 0,
        totalRounds: event.metadata?.totalRounds || 1,
        roundHistory: event.metadata?.roundHistory || {},
        byeHistory: event.metadata?.byeHistory || []
      }
    };
    
    return this.eventRepository.updateEvent(eventId, updates);
  }

  /**
   * Completes the current round and prepares for the next round
   * @param eventId - The ID of the event
   * @param round - The current round number being completed
   * @param pairings - The pairings for the next round
   */
  public async completeRound(eventId: string, round: number, pairings: Match[]): Promise<void> {
    try {
      // Step 1: Get current round matches
      const currentRoundMatches = await this.eventRepository.getRoundMatches(eventId, round);
      
      // Step 2: Update current round matches to 'completed' status
      for (const match of currentRoundMatches) {
        await this.eventRepository.updateEventMatch(eventId, match.id, { status: 'completed' });
      }
      
      // Step 3: Update event metadata (increment round)
      const event = await this.eventRepository.getEvent(eventId);
      if (!event) {
        throw new Error('Event not found');
      }

      if (!event.metadata) {
        throw new Error('Event metadata is missing');
      }
      
      await this.eventRepository.updateEvent(eventId, {
        metadata: {
          currentRound: round + 1,
          lastUpdated: new Date().toISOString()
,
          totalPlayers: event.metadata.totalPlayers,
          totalMatches: event.metadata.totalMatches,
          totalRounds: event.metadata.totalRounds,
          roundHistory: event.metadata.roundHistory,
          byeHistory: event.metadata.byeHistory
        }
      });
      
      // Step 4: Save pairings for the next round
      for (const pairing of pairings) {
        await this.eventRepository.addEventMatch(eventId, {
          ...pairing,
  
          status: 'pending'
        });
      }
      
      // Step 5: Recalculate rankings
      const rankingService = new RankingService(this.eventRepository, this.playerRepository);
      await rankingService.updateRoundRankings(eventId, round);
      
    } catch (error) {
      console.error('Error completing round:', error);
      throw new Error(`Failed to complete round: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Undoes the completion of a round, resetting match statuses and event metadata
   * @param eventId - The ID of the event
   */
  public async undoCompleteRound(eventId: string): Promise<void> {
    try {
      // Step 1: Fetch event and validate
      const event = await this.eventRepository.getEvent(eventId);
      if (!event) {
        throw new Error('Event not found');
      }

      if (!event.metadata) {
        throw new Error('Event metadata is missing');
      }

      // Step 2: Determine round to undo
      const currentRound = event.metadata.currentRound;
      if (!currentRound || currentRound <= 1) {
        throw new Error('Cannot undo round: No completed rounds available');
      }

      // Step 3: Fetch matches for the round to undo
      const roundToUndo = currentRound; // Current round is the one to undo
      const matchesToUndo = await this.eventRepository.getRoundMatches(eventId, roundToUndo);

      // Step 4: Update match statuses to 'pending'
      for (const match of matchesToUndo) {
        await this.eventRepository.updateEventMatch(eventId, match.id, { 
          status: 'pending' 
        });
      }

      // Step 5: Update event metadata (decrement round)
      await this.eventRepository.updateEvent(eventId, {
        metadata: {
          ...event.metadata,
          currentRound: currentRound - 1,
          lastUpdated: new Date().toISOString()
        }
      });

      // Step 6: Recalculate rankings for the previous round
      const previousRound = currentRound - 1; // Recalculate for the round before the current one
      if (previousRound >= 1) {
        const rankingService = new RankingService(this.eventRepository, this.playerRepository);
        await rankingService.updateRoundRankings(eventId, previousRound);
      }

    } catch (error) {
      console.error('Error undoing round completion:', error);
      throw new Error(`Failed to undo round completion: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}
