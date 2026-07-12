/**
 * Barème et spread — Règlement V2 §III.
 * Source unique : les copies locales de calculatePR/calculateDS
 * dans les services, routes et composants importent d'ici.
 */

/** Plafond du spread par match (Règlement V2 §III.B, réglable §IX). */
export const SPREAD_CAP = 100;

/** Spread forfaitaire : +50 pour le présent, −50 pour le forfait (§VI). */
export const FORFEIT_SPREAD = 50;

/**
 * Spread signé du point de vue du premier score, plafonné à ±SPREAD_CAP.
 * Remplace l'ancienne « Différence de Score » en pourcentage.
 */
export function calculateSpread(playerScore: number, opponentScore: number): number {
  return Math.min(SPREAD_CAP, Math.max(-SPREAD_CAP, playerScore - opponentScore));
}

/** PR du point de vue du premier score : victoire 3, nul 1, défaite 0 (§III.A). */
export function calculatePR(playerScore: number, opponentScore: number): number {
  if (playerScore > opponentScore) return 3;
  if (playerScore === opponentScore) return 1;
  return 0;
}
