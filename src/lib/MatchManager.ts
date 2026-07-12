import { Match, PlayerMatchInfo } from '../types/Match';
import { Player } from '../types/Player';
import { v4 as uuidv4 } from 'uuid';
import { generateSwissPairings } from './SwissPairing';

export interface PairingResult {
  player1: Player;
  player2?: Player; // Optional for BYE
}

/**
 * Génère les appariements d'une ronde. Le traitement des résultats
 * (cotes, PR, spread, forfaits) vit dans MatchService — les anciennes
 * méthodes processMatch/processForfeitMatch dupliquaient cette logique
 * avec des formules divergentes et n'étaient appelées nulle part.
 */
export class MatchManager {
  private players: Player[];
  private previousMatches: Match[];

  constructor(players: Player[], previousMatches: Match[] = []) {
    this.players = players;
    this.previousMatches = previousMatches;
  }

  /**
   * Appariement suisse par groupes de points (Règlement V2 §IV.B) :
   * tri PR puis cote, moitié haute contre moitié basse, anti re-match
   * sur 4 rondes avec relâchement, bye au moins bien classé sans bye
   * récent. Voir SwissPairing.ts.
   */
  generatePairings(round: number): PairingResult[] {
    return generateSwissPairings(this.players, this.previousMatches, round);
  }


  createMatch(player1: Player, player2: Player): Match {
    const player1Info: PlayerMatchInfo = {
      id: player1.id,
      ratingBefore: player1.currentRating,
      ratingAfter: player1.currentRating,
      categoryBefore: player1.category,
      categoryAfter: player1.category
    };

    const player2Info: PlayerMatchInfo = {
      id: player2.id,
      ratingBefore: player2.currentRating,
      ratingAfter: player2.currentRating,
      categoryBefore: player2.category,
      categoryAfter: player2.category
    };

    return {
      id: uuidv4(),
      eventId: '', // Will be set by the event system
      date: new Date().toISOString().split('T')[0],
      player1: player1Info,
      player2: player2Info,
      status: 'pending',
      metadata: {
        round: 1,
        isRandom: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    };
  }
}
