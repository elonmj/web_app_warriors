import { Match } from '@/types/Match';
import { Player } from '@/types/Player';
import { calculatePR } from './scoring';

/**
 * Appariement suisse par groupes de points — Règlement V2 §IV.B.
 *
 * - Tri : PR saisonniers décroissants, puis cote décroissante.
 * - Appariement moitié haute contre moitié basse au sein d'un groupe de
 *   points ; le joueur excédentaire « flotte » vers le groupe inférieur.
 * - Anti re-match : pas deux fois le même adversaire dans les
 *   REMATCH_WINDOW dernières rondes ; la contrainte se relâche
 *   (4 → 3 → 2 → 1 → 0) si le pool la rend insatisfiable.
 * - Bye : au joueur le moins bien classé du pool sans bye dans les
 *   BYE_WINDOW dernières rondes (§IV.C).
 */

export const REMATCH_WINDOW = 4;
export const BYE_WINDOW = 3;

export interface SwissPairingResult {
  player1: Player;
  player2?: Player; // undefined = BYE
}

/**
 * PR saisonniers par joueur, calculés depuis l'historique des matchs de
 * l'événement (mêmes règles que RankingService : bye 3, forfait 3/0,
 * double forfait 0/0, sinon PR 3/1/0).
 */
export function computeSeasonPoints(matches: Match[]): Map<string, number> {
  const points = new Map<string, number>();
  const add = (id: string, pts: number) =>
    points.set(id, (points.get(id) ?? 0) + pts);

  for (const match of matches) {
    if (!match.result) continue;
    if (match.status !== 'completed' && match.status !== 'forfeit') continue;

    if (match.player2.id === 'BYE') {
      add(match.player1.id, 3);
      continue;
    }

    const [s1, s2] = match.result.score;
    if (match.status === 'forfeit') {
      if (s1 === s2) continue; // double forfait : 0 chacun
      add(s1 > s2 ? match.player1.id : match.player2.id, 3);
      continue;
    }

    add(match.player1.id, calculatePR(s1, s2));
    add(match.player2.id, calculatePR(s2, s1));
  }

  return points;
}

/** Adversaires rencontrés dans les `window` rondes précédant `round`. */
function recentOpponents(
  matches: Match[],
  round: number,
  window: number
): Map<string, Set<string>> {
  const map = new Map<string, Set<string>>();
  if (window <= 0) return map;

  const addOpponent = (a: string, b: string) => {
    if (!map.has(a)) map.set(a, new Set());
    map.get(a)!.add(b);
  };

  for (const match of matches) {
    const matchRound = match.metadata?.round ?? 0;
    if (matchRound < round - window || matchRound >= round) continue;
    if (match.player2.id === 'BYE') continue;
    addOpponent(match.player1.id, match.player2.id);
    addOpponent(match.player2.id, match.player1.id);
  }

  return map;
}

/** Rondes où chaque joueur a reçu un bye. */
function byeRounds(matches: Match[]): Map<string, number[]> {
  const map = new Map<string, number[]>();
  for (const match of matches) {
    if (match.player2.id !== 'BYE') continue;
    const rounds = map.get(match.player1.id) ?? [];
    rounds.push(match.metadata?.round ?? 0);
    map.set(match.player1.id, rounds);
  }
  return map;
}

/**
 * Choisit le joueur qui reçoit le bye : le moins bien classé du pool
 * sans bye dans les BYE_WINDOW dernières rondes ; à défaut, celui dont
 * le dernier bye est le plus ancien.
 */
function pickByePlayer(
  sortedPlayers: Player[],
  matches: Match[],
  round: number
): Player {
  const byes = byeRounds(matches);
  const fromBottom = [...sortedPlayers].reverse();

  const eligible = fromBottom.find((p) => {
    const rounds = byes.get(p.id) ?? [];
    return !rounds.some((r) => r >= round - BYE_WINDOW);
  });
  if (eligible) return eligible;

  // Tout le monde a eu un bye récent : prendre le bye le plus ancien
  return fromBottom.reduce((oldest, p) => {
    const last = Math.max(...(byes.get(p.id) ?? [0]));
    const oldestLast = Math.max(...(byes.get(oldest.id) ?? [0]));
    return last < oldestLast ? p : oldest;
  });
}

/**
 * Ordonne les candidats pour `player` : d'abord son groupe de points en
 * partant du milieu du groupe (moitié haute vs moitié basse), puis les
 * groupes suivants dans l'ordre du classement.
 */
function orderCandidates(
  player: Player,
  candidates: Player[],
  points: Map<string, number>
): Player[] {
  const playerPoints = points.get(player.id) ?? 0;
  const sameGroup = candidates.filter((c) => (points.get(c.id) ?? 0) === playerPoints);
  const others = candidates.filter((c) => (points.get(c.id) ?? 0) !== playerPoints);

  const half = Math.floor(sameGroup.length / 2);
  const ordered = [...sameGroup].sort(
    (a, b) =>
      Math.abs(sameGroup.indexOf(a) - half) - Math.abs(sameGroup.indexOf(b) - half)
  );

  return [...ordered, ...others];
}

/** Appariement par backtracking sous contrainte anti re-match. */
function pairWithConstraint(
  players: Player[],
  points: Map<string, number>,
  forbidden: Map<string, Set<string>>
): [Player, Player][] | null {
  if (players.length === 0) return [];

  const [first, ...rest] = players;
  const candidates = orderCandidates(first, rest, points);

  for (const candidate of candidates) {
    if (forbidden.get(first.id)?.has(candidate.id)) continue;
    const remaining = rest.filter((p) => p.id !== candidate.id);
    const solution = pairWithConstraint(remaining, points, forbidden);
    if (solution) return [[first, candidate], ...solution];
  }

  return null;
}

export function generateSwissPairings(
  poolPlayers: Player[],
  previousMatches: Match[],
  round: number
): SwissPairingResult[] {
  if (poolPlayers.length === 0) return [];
  if (poolPlayers.length === 1) return [{ player1: poolPlayers[0] }];

  const points = computeSeasonPoints(previousMatches);

  // Tri : PR décroissants, puis cote décroissante
  const sorted = [...poolPlayers].sort((a, b) => {
    const diff = (points.get(b.id) ?? 0) - (points.get(a.id) ?? 0);
    if (diff !== 0) return diff;
    return b.currentRating - a.currentRating;
  });

  // Bye si effectif impair
  let byePlayer: Player | undefined;
  let toPair = sorted;
  if (sorted.length % 2 === 1) {
    byePlayer = pickByePlayer(sorted, previousMatches, round);
    toPair = sorted.filter((p) => p.id !== byePlayer!.id);
  }

  // Anti re-match avec relâchement progressif (4 → 3 → 2 → 1 → 0)
  let pairs: [Player, Player][] | null = null;
  for (let window = REMATCH_WINDOW; window >= 0 && !pairs; window--) {
    pairs = pairWithConstraint(
      toPair,
      points,
      recentOpponents(previousMatches, round, window)
    );
  }

  const results: SwissPairingResult[] = (pairs ?? []).map(([player1, player2]) => ({
    player1,
    player2
  }));
  if (byePlayer) results.push({ player1: byePlayer });

  return results;
}
