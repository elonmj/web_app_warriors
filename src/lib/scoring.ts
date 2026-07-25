/**
 * Barème et spread — Règlement V3 §IV.
 * Source unique : les copies locales de calculatePR/calculateDS
 * dans les services, routes et composants importent d'ici.
 */

/** Plafond du spread par match (Règlement V3 §IV.B, réglable §XII). */
export const SPREAD_CAP = 100;

/**
 * PR d'un match non joué (Règlement V3 §V) : −1 pour LES DEUX joueurs.
 *
 * C'est le seul écart qui fait tenir le système : jouer et perdre rapporte 0,
 * ne pas jouer coûte 1. Se présenter est donc toujours meilleur que disparaître,
 * et le silence de l'adversaire coûte un point à chacun — d'où la responsabilité
 * mutuelle d'aller chercher l'autre.
 *
 * La cote Elo, elle, n'est jamais touchée : elle mesure la force, pas l'assiduité.
 */
export const MISSED_ROUND_PR = -1;

/**
 * Absences consécutives avant mise en sommeil (Règlement V3 §VI).
 *
 * C'est le garde-fou du système : passé ce seuil le joueur sort du pool et
 * cesse de perdre des points, donc une disparition coûte au maximum
 * 3 × MISSED_ROUND_PR, quelle que soit sa durée. Personne ne peut se retrouver
 * mathématiquement hors-course pour avoir été absent.
 *
 * Trois et non deux : dans un club de douze joueurs qui se connaissent, six
 * jours de silence sont souvent un défaut de communication, neuf jours non.
 */
export const MISSED_ROUNDS_BEFORE_SLEEP = 3;

/** @deprecated Le forfait V2 (+50/−50) n'existe plus : un match non joué ne
 *  produit aucun spread, faute de partie à mesurer (V3 §IV.B). Conservé pour
 *  la relecture des matchs enregistrés avant la V3. */
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
