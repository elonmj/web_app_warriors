import { Match } from '@/types/Match';
import { Player, PlayerStatistics } from '@/types/Player';
import { PlayerCategoryType } from '@/types/Enums';

interface RatingConfig {
  kFactors: {
    provisional: number; // K=40 — moins de provisionalMatches joués
    returning: number;   // K=30 — retour après inactivité (Règlement V2 §V.D)
    standard: number;    // K=20 — régime normal
    elite: number;       // K=10 — cote >= eliteThreshold
  };
  provisionalMatches: number; // durée de la période provisoire (en matchs)
  returningMatches: number;   // nombre de matchs au K de retour après une inactivité
  inactivityWeeks: number;    // écart entre deux matchs qui compte comme inactivité
  eliteThreshold: number;
  ratingFloor: number;        // sous le point d'entrée (1000) pour que les nouveaux ne soient pas « incassables »
  ratingDivider: number;      // 400, ajustable par le comité
}

const DEFAULT_CONFIG: RatingConfig = {
  kFactors: {
    provisional: 40,
    returning: 30,
    standard: 20,
    elite: 10
  },
  provisionalMatches: 15,
  returningMatches: 5,
  inactivityWeeks: 6,
  eliteThreshold: 1900,
  ratingFloor: 800,
  ratingDivider: 400
};

const MS_PER_WEEK = 7 * 24 * 60 * 60 * 1000;

/**
 * Contexte joueur nécessaire au choix du K. Construit via buildContext()
 * à partir du vrai joueur — les anciens joueurs temporaires à
 * totalMatches: 0 donnaient K=30 à tout le monde.
 */
interface PlayerRatingContext {
  matchesPlayed: number;
  isReturning: boolean;
}

class RatingSystem {
  private config: RatingConfig;

  constructor(config: Partial<RatingConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Construit le contexte de cote d'un joueur pour un match joué à atDate.
   * isReturning : une coupure d'au moins inactivityWeeks existe dans
   * l'historique et moins de returningMatches ont été joués depuis.
   */
  buildContext(player: Player, atDate: string = new Date().toISOString()): PlayerRatingContext {
    const dates = (player.matches ?? [])
      .map((m) => new Date(m.date).getTime())
      .filter((t) => !Number.isNaN(t))
      .sort((a, b) => b - a); // plus récent d'abord

    const matchesPlayed = player.statistics?.totalMatches ?? dates.length;

    const at = new Date(atDate).getTime();
    const inactivityMs = this.config.inactivityWeeks * MS_PER_WEEK;

    let isReturning = false;
    if (dates.length > 0) {
      // Cherche la coupure la plus récente : entre ce match et le dernier
      // joué, puis entre matchs consécutifs de l'historique.
      let matchesSinceGap = 0;
      let previous = at;
      for (const date of dates) {
        if (previous - date >= inactivityMs) {
          isReturning = matchesSinceGap < this.config.returningMatches;
          break;
        }
        matchesSinceGap++;
        previous = date;
      }
    }

    return { matchesPlayed, isReturning };
  }

  /**
   * K par expérience (Règlement V2 §V.B) : provisoire, retour, élite, normal.
   */
  determineKFactor(context: PlayerRatingContext, rating: number): number {
    const { kFactors, provisionalMatches, eliteThreshold } = this.config;
    if (context.matchesPlayed < provisionalMatches) return kFactors.provisional;
    if (context.isReturning) return kFactors.returning;
    if (rating >= eliteThreshold) return kFactors.elite;
    return kFactors.standard;
  }

  /**
   * Probabilité de victoire estimée (We)
   */
  calculateExpectedScore(playerRating: number, opponentRating: number): number {
    const exponent = (opponentRating - playerRating) / this.config.ratingDivider;
    return 1 / (1 + Math.pow(10, exponent));
  }

  /**
   * Nouvelle cote après un match — Elo pur, à somme quasi nulle.
   * Le bonus DS de la V1 (vainqueur seul, inflationniste) est supprimé :
   * l'ampleur des victoires est valorisée par le spread au départage,
   * pas dans la cote (Règlement V2 §V.C).
   */
  calculateNewRating(
    rating: number,
    opponentRating: number,
    outcome: 1 | 0.5 | 0,
    context: PlayerRatingContext
  ): number {
    const K = this.determineKFactor(context, rating);
    const expectedScore = this.calculateExpectedScore(rating, opponentRating);
    const newRating = rating + Math.round(K * (outcome - expectedScore));
    return Math.max(this.config.ratingFloor, newRating);
  }

  /**
   * Calcule les nouvelles cotes des deux joueurs d'un match.
   * Les contextes viennent de buildContext() sur les vrais joueurs ;
   * à défaut, régime normal (ni provisoire, ni retour).
   */
  processMatchRatings(
    match: Match,
    player1Context?: PlayerRatingContext,
    player2Context?: PlayerRatingContext
  ): [number, number] {
    if (!match.result) {
      throw new Error('Match result not available');
    }

    const defaultContext: PlayerRatingContext = {
      matchesPlayed: this.config.provisionalMatches,
      isReturning: false
    };

    const rating1 = match.player1.ratingBefore;
    const rating2 = match.player2.ratingBefore;

    const [score1, score2] = match.result.score;
    const outcome1: 1 | 0.5 | 0 = score1 > score2 ? 1 : score1 === score2 ? 0.5 : 0;
    const outcome2: 1 | 0.5 | 0 = outcome1 === 1 ? 0 : outcome1 === 0 ? 1 : 0.5;

    const newRating1 = this.calculateNewRating(
      rating1,
      rating2,
      outcome1,
      player1Context ?? defaultContext
    );
    const newRating2 = this.calculateNewRating(
      rating2,
      rating1,
      outcome2,
      player2Context ?? defaultContext
    );

    return [newRating1, newRating2];
  }

  /**
   * Initialize PlayerStatistics with all required properties
   */
  initializeStatistics(): PlayerStatistics {
    return {
      totalMatches: 0,
      wins: 0,
      draws: 0,
      losses: 0,
      totalPR: 0,
      averageDS: 0,
      inactivityWeeks: 0,
      forfeits: { given: 0, received: 0 },
      bestRating: 1000,
      worstRating: 1000,
      categoryHistory: [],
      eventParticipation: []
    };
  }

  /**
   * Get category based on rating
   */
  getCategory(rating: number): PlayerCategoryType {
    if (rating >= 1900) return "DIAMANT";
    if (rating >= 1700) return "TOPAZE";
    if (rating >= 1400) return "AMÉTHYSTE";
    return "ONYX";
  }
}

export { RatingSystem };
export type { RatingConfig, PlayerRatingContext };
