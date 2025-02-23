import { EventRepository } from '../repository/eventRepository';
import { Event } from '@/types/Event';
import { Match } from '@/types/Match';
import { Player } from '@/types/Player';
import { PlayerCategory } from '@/types/Enums';

export class EventService {
  private eventRepository: EventRepository;

  constructor() {
    this.eventRepository = new EventRepository();
  }

  async generatePairings(
    eventId: string,
    options: { 
      avoidRematches: boolean; 
      balanceCategories: boolean;
      isFirstRound?: boolean;
      preview?: boolean;
    }
  ) {
    const event = await this.eventRepository.getEvent(eventId);
    if (!event) {
      throw new Error('Event not found');
    }

    // Get players for this event
    const players = await this.eventRepository.getPlayers();
    const round = event.metadata?.currentRound || 1;

    // Get matches history for rematch checking
    const previousMatches: Match[] = [];
    if (!options.isFirstRound) {
      for (let r = 1; r < round; r++) {
        const roundMatches = await this.eventRepository.getRoundMatches(eventId, r);
        previousMatches.push(...roundMatches);
      }
    }

    // Filter and sort players
    const eventPlayers = players.filter(p => p.matches.some(m => m.eventId === eventId));
    let sortedPlayers: Player[];

    if (options.isFirstRound) {
      // Random shuffle for first round
      sortedPlayers = [...eventPlayers].sort(() => Math.random() - 0.5);
    } else {

      // Sort by performance for subsequent rounds
      sortedPlayers = [...eventPlayers].sort((a, b) => {
        const prDiff = (b.statistics?.totalPR || 0) - (a.statistics?.totalPR || 0);
        if (prDiff !== 0) return prDiff;
        const dsDiff = (b.statistics?.averageDS || 0) - (a.statistics?.averageDS || 0);
        if (dsDiff !== 0) return dsDiff;
        return b.currentRating - a.currentRating;
      });
    }


    const matches: Match[] = [];
    const paired = new Set<string>();

    // Handle pairings based on classment.md III.B
    for (let i = 0; i < sortedPlayers.length; i++) {
      const player1 = sortedPlayers[i];
      if (paired.has(player1.id)) continue;

      // Find opponent from bottom of rankings up
      let opponent = null;
      for (let j = sortedPlayers.length - 1; j > i; j--) {
        const player2 = sortedPlayers[j];
        if (paired.has(player2.id)) continue;

        // Check for rematches only if not first round
        if (!options.isFirstRound && options.avoidRematches) {
          const hasPlayed = previousMatches.some(
            m => (m.player1.id === player1.id && m.player2.id === player2.id) ||
                 (m.player1.id === player2.id && m.player2.id === player1.id)
          );
          if (hasPlayed) continue;
        }

        // If balancing categories, prefer opponents of same category
        if (options.balanceCategories && player1.category !== player2.category) {
          // Keep looking for same category opponent if possible
          const sameCategory = sortedPlayers.slice(j-1).find(p => 
            !paired.has(p.id) && p.category === player1.category
          );
          if (sameCategory) {
            opponent = sameCategory;
            break;
          }
        }

        opponent = player2;
        break;
      }

      if (opponent) {
        // Create match
        matches.push({
          id: `${eventId}-R${round}-${Date.now()}-${player1.id}-${opponent.id}`,
          eventId,
          date: new Date().toISOString().split('T')[0],
          player1: {
            id: player1.id,
            ratingBefore: player1.currentRating,
            ratingAfter: player1.currentRating,
            categoryBefore: player1.category,
            categoryAfter: player1.category
          },
          player2: {
            id: opponent.id,
            ratingBefore: opponent.currentRating,
            ratingAfter: opponent.currentRating,
            categoryBefore: opponent.category,
            categoryAfter: opponent.category
          },
          status: 'pending',
          metadata: {
            round,
            isRandom: false,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          }
        });
        paired.add(player1.id);
        paired.add(opponent.id);
      }
    }

    // Handle bye if odd number of players
    const unpairedPlayer = sortedPlayers.find(p => !paired.has(p.id));
    if (unpairedPlayer) {
      matches.push({
        id: `${eventId}-R${round}-${Date.now()}-${unpairedPlayer.id}-BYE`,
        eventId,
        date: new Date().toISOString().split('T')[0],
        player1: {
          id: unpairedPlayer.id,
          ratingBefore: unpairedPlayer.currentRating,
          ratingAfter: unpairedPlayer.currentRating,
          categoryBefore: unpairedPlayer.category,
          categoryAfter: unpairedPlayer.category
        },
        player2: {
          id: 'BYE',
          ratingBefore: 0,
          ratingAfter: 0,
          categoryBefore: PlayerCategory.ONYX,
          categoryAfter: PlayerCategory.ONYX
        },
        status: 'pending',
        metadata: {
          round,
          isRandom: false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      });
    }
    return {
      matches,
      round,
      warnings: []
    };
  }

  async completeRound(eventId: string, round: number) {
    const event = await this.eventRepository.getEvent(eventId);
    if (!event) {
      throw new Error('Event not found');
    }

    // Ensure all matches for current round are completed
    const matches = await this.eventRepository.getRoundMatches(eventId, round);
    const incomplete = matches.filter(match => !match.result);
    if (incomplete.length > 0) {
      throw new Error('Cannot complete round with incomplete matches');
    }

    // Update event metadata
    const currentRound = event.metadata?.currentRound || 1;
    const updatedMetadata = {
      ...event.metadata,
      currentRound: currentRound + 1,
      lastCompletedRound: currentRound
    };

    // Save updated event
    await this.eventRepository.updateEvent(eventId, {
      ...event,
      metadata: updatedMetadata
    });

    return true;
  }

  async undoCompleteRound(eventId: string) {
    const event = await this.eventRepository.getEvent(eventId);
    if (!event) {
      throw new Error('Event not found');
    }

    // Check if there's a round to undo
    if (!event.metadata?.currentRound || event.metadata.currentRound <= 1) {
      throw new Error('No round to undo');
    }

    // Update event metadata
    const currentRound = event.metadata.currentRound;
    const updatedMetadata = {
      ...event.metadata,
      currentRound: currentRound - 1,
      lastCompletedRound: currentRound - 2 >= 0 ? currentRound - 2 : undefined
    };

    // Save updated event
    await this.eventRepository.updateEvent(eventId, {
      ...event,
      metadata: updatedMetadata
    });

    return true;
  }
}
